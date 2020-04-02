import * as observationService from './observation.service';
import * as check from 'check-types';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {Forbidden} from '../../errors/Forbidden';
import {getDeployments} from '../deployment/deployment.service';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {formatObservationForClient, addContextToObservation, addContextToObservations} from './observation.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';


//-------------------------------------------------
// Get observations 
//-------------------------------------------------
export async function getObservations(where: any, options: {limit?: number; offset?: number; onePer?: string; sortBy: string; sortOrder: string}, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  const canAccessAllObservations = user.permissions.includes('get:observation') || user.permissions.includes('admin-all:deployments');
  // It's worth having the get:observations permission in addition to the admin-all:deployments permission as you may have users who should have access to all the observation, but not be allowed to see any of the extra data that would accessable if they were an admin to every deployment, e.g. a platform's description.

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has rights to these deployment(s).
  if (where.inDeployment) {

    const deploymentIdsToCheck = check.string(where.inDeployment) ? [check.string(where.inDeployment)] : where.inDeployment.in;

    if (canAccessAllObservations) {
      // For users that can access all observations, all we need to check here is that the deployment ID(s) they have provided are for deployments that actually exist.
      // N.b. this should error if any of the deployments don't exist
      await getLevelsForDeployments(deploymentIdsToCheck);
    }

    if (!canAccessAllObservations) {
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
  // inDeployment unspecified
  //------------------------
  // If no deployment has been specified then get a list of all the public deployments and the user's own deployments.
  if (!where.inDeployment && !canAccessAllObservations) {

    let usersDeployments = [];
    let publicDeployments = [];
    if (user.id) {
      usersDeployments = await getDeployments({user: user.id});
    }
    publicDeployments = await getDeployments({public: true});
    const combindedDeployments = concat(usersDeployments, publicDeployments);
    const uniqueDeployments = uniqBy(combindedDeployments, 'id');
    if (uniqueDeployments.length === 0) {
      throw new Forbidden('You do not have access to any deployments and therefore its not possible to retrieve any observations.');
    }
    const deploymentIds = uniqueDeployments.map((deployment): string => deployment.id);
    updatedWhere.inDeployment = {
      in: deploymentIds
    };

  }

  // TODO: If the user doesn't provide specific deploymentIds then we get a list for them. This means that if isHostedBy or madeBySensor parameters are specified then no observations will be returned for these if they don't belong in the user's deployments. The question is whether we should throw an error that lets them know that the platform or sensor isn't in the list of deployments.

  // Quick safety check to make sure non-super users can't go retrieving observations without their deployments being defined.
  if (canAccessAllObservations && (!where.inDeployment && !where.inDeployment.in)) {
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

  if (check.object(where.flag)) {
    updatedWhere.flags = where.flag;
  }
  delete updatedWhere.flag;

  if (check.object(where.discipline) && check.nonEmptyString(where.discipline.includes)) {
    updatedWhere.discipline = where.discipline.includes;
  }

  const {observations, meta} = await observationService.getObservations(updatedWhere, options);
  const observationsForClient = observations.map(formatObservationForClient);
  const observationsWithContext = addContextToObservations(observationsForClient, meta);
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
      deploymentLevels = await getLevelsForDeployments(observation.inDeployments, user.id);
    } else {
      deploymentLevels = await getLevelsForDeployments(observation.inDeployments);
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

  const observationForClient = formatObservationForClient(observation);
  const observationWithContext = addContextToObservation(observationForClient);
  return observationWithContext;

}


//-------------------------------------------------
// Create Observation
//-------------------------------------------------
export async function createObservation(observation, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:observation');

  const createdObservation = await observationService.createObservation(observation);
  const observationForClient = formatObservationForClient(createdObservation);
  const observationWithContext = addContextToObservation(observationForClient);
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