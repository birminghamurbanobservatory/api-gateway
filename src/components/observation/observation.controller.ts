import * as observationService from './observation.service';
import * as check from 'check-types';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {Forbidden} from '../../errors/Forbidden';
import {getDeployments} from '../deployment/deployment.service';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {createObservationsResponse, createObservationResponse} from './observation.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import * as logger from 'node-logger';

//-------------------------------------------------
// Get observations 
//-------------------------------------------------
export async function getObservations(where: any, options: {limit?: number; offset?: number; onePer?: string; sortBy: string; sortOrder: string}, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  const deploymentDefined = check.nonEmptyString(where.hasDeployment) || (check.nonEmptyObject(where.hasDeployment) && check.nonEmptyArray(where.hasDeployment.in));

  const canAccessAllObservations = user.permissions.includes('get:observation');
  const canAccessAllDeploymentObservations = user.permissions.includes('get:observation') || user.permissions.includes('admin-all:deployments');
  // It's worth having the get:observations permission in addition to the admin-all:deployments permission as you may have users who should have access to all the observation, but not be allowed to see any of the extra data that would accessible if they were an admin to every deployment, e.g. a platform's description. Also it stops user with just the admin-all:deployments permission from getting observations not bound to a deployment
  logger.debug(`Can access all observations: ${canAccessAllObservations}`);
  logger.debug(`Can access observations from all deployments: ${canAccessAllDeploymentObservations}`);
  logger.debug(`Deployment(s) specified: ${deploymentDefined}`);

  //------------------------
  // hasDeployment specified
  //------------------------
  // If hasDeployment has been specified then check that the user has rights to these deployment(s).
  if (deploymentDefined) {

    const deploymentIdsToCheck = check.string(where.hasDeployment) ? [check.string(where.hasDeployment)] : where.hasDeployment.in;

    if (canAccessAllDeploymentObservations) {
      // For users that can access all observations, all we need to check here is that the deployment ID(s) they have provided are for deployments that actually exist.
      // N.b. this should error if any of the deployments don't exist
      await getLevelsForDeployments(deploymentIdsToCheck);
    }

    if (!canAccessAllDeploymentObservations) {
      // Decided to add an event-stream that lets us check a user's rights to multiple deployments in a single request. I.e can pass a single userId (or none at all), and an array of deployment IDs, and for each we return the level of access they have. The benefit being that we have a single even stream request, with only the vital data being returned, and the sensor-deployment-manager can be setup so it only makes a single mongodb request to get info on multiple deployments. Therefore should be faster.
      let deploymentLevels;
      if (user.id) {
        // N.b. this should error if any of the deployments don't exist
        deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck, user.id);
      } else {
        deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck);
      }

      // If there's no level defined for any of these deployments then throw an error.
      // the level will be 'basic' for any public deployments
      deploymentLevels.forEach((deploymentLevel): void => {
        if (!deploymentLevel.level) {
          throw new Forbidden(`You do not have the rights to access observations from the deployment '${deploymentLevel.deploymentId}'.`);
        }
      });
    }
    
  }

  //------------------------
  // hasDeployment unspecified
  //------------------------
  // If no deployment has been specified then get a list of all the public deployments and the user's own deployments.
  if (!deploymentDefined && !canAccessAllObservations) {

    let usersDeployments = [];
    let publicDeployments = [];
    if (user.id) {
      const response = await getDeployments({user: user.id});
      usersDeployments = response.deployments;
    }
    const response = await getDeployments({public: true});
    publicDeployments = response.deployments;
    const combindedDeployments = concat(usersDeployments, publicDeployments);
    const uniqueDeployments = uniqBy(combindedDeployments, 'id');
    if (uniqueDeployments.length === 0) {
      throw new Forbidden('You do not have access to any deployments and therefore its not possible to retrieve any observations.');
    }
    const deploymentIds = uniqueDeployments.map((deployment): string => deployment.id);
    updatedWhere.hasDeployment = {
      in: deploymentIds
    };

  }

  // TODO: If the user doesn't provide specific deploymentIds then we get a list for them. This means that if isHostedBy or madeBySensor parameters are specified then no observations will be returned for these if they don't belong in the user's deployments. The question is whether we should throw an error that lets them know that the platform or sensor isn't in the list of deployments.

  // For users that can access all deployment observations, but not observations unbound to a deployment, we'll need make sure they can't get observations without a deployment
  if (!deploymentDefined && canAccessAllDeploymentObservations && !canAccessAllObservations) {
    updatedWhere.hasDeployment = {
      exists: true
    };
  }

  // Quick safety check to make sure non-super users can't go retrieving observations without their deployments being defined.
  if (!canAccessAllDeploymentObservations && check.not.nonEmptyArray(updatedWhere.hasDeployment.in)) {
    throw new Error(' A non-superuser is able to request observations without specifying deployments. Server code needs editing to fix this.');
  }

  // Some service/event-stream where properties are a tad different to the query parameters
  if (check.nonEmptyArray(where.ancestorPlatforms)) {
    updatedWhere.hostedByPath = where.ancestorPlatforms;
  }
  if (check.object(where.ancestorPlatforms) && where.ancestorPlatforms.includes) {
    updatedWhere.isHostedBy = where.ancestorPlatforms.includes;
  }
  delete updatedWhere.ancestorPlatforms;

  if (check.object(where.disciplines) && check.nonEmptyString(where.disciplines.includes)) {
    updatedWhere.discipline = where.disciplines.includes;
    delete updatedWhere.disciplines;
  }

  if (check.assigned(where.inTimeseries)) {
    updatedWhere.timeseriesId = where.inTimeseries;
    delete updatedWhere.inTimeseries;
  }

  const {observations, meta} = await observationService.getObservations(updatedWhere, options);
  const observationsWithContext = createObservationsResponse(observations, meta);
  return observationsWithContext;

}


//-------------------------------------------------
// Get Observation
//-------------------------------------------------
export async function getObservation(observationId, user: ApiUser): Promise<any> {

  let hasSufficientRights; 
  const canAccessAllObservations = user.permissions.includes('get:observation') || user.permissions.includes('admin-all:deployments');

  const observation = await observationService.getObservation(observationId);

  if (canAccessAllObservations) {
    hasSufficientRights = true;

  } else {
    
    let deploymentLevels;
    if (user.id) {
      // N.b. this should error if any of the deployments don't exist
      deploymentLevels = await getLevelsForDeployments([observation.hasDeployment], user.id);
    } else {
      deploymentLevels = await getLevelsForDeployments([observation.hasDeployment]);
    }

    const hasRightsToAtLeastOneDeployment = deploymentLevels.some((deploymentLevel): boolean => {
      return Boolean(deploymentLevel.level);
    });

    if (hasRightsToAtLeastOneDeployment) {
      hasSufficientRights = true;
    }

  }

  if (!hasSufficientRights) {
    throw new Forbidden(`You do not have the deployment access levels required to access observation '${observationId}'`);
  }

  const observationWithContext = createObservationResponse(observation);
  return observationWithContext;

}


//-------------------------------------------------
// Create Observation
//-------------------------------------------------
export async function createObservation(observation, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:observation');

  const createdObservation = await observationService.createObservation(observation);
  const observationWithContext = createObservationResponse(createdObservation);
  return observationWithContext;

}


//-------------------------------------------------
// Delete Observation
//-------------------------------------------------
export async function deleteObservation(observationId: string, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'delete:observation');
  await observationService.deleteObservation(observationId);
  return;

}