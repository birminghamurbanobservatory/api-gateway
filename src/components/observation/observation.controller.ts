import * as observationService from './observation.service';
import * as check from 'check-types';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {Forbidden} from '../../errors/Forbidden';
import {getDeployments} from '../deployment/deployment.service';
import {concat, uniqBy} from 'lodash';
import {formatObservationForClient} from './observation.formatter';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';


//-------------------------------------------------
// Get observations 
//-------------------------------------------------
export async function getObservations(where: any, options: {limit?: number; offset?: number}, user: {id?: string; canAccessAllObservations?: boolean}): Promise<any> {

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has rights to these deployment(s).
  if (where.inDeployment) {

    const deploymentIdsToCheck = check.string(where.inDeployment) ? [check.string(where.inDeployment)] : where.inDeployment.in;

    if (user.canAccessAllObservations) {
      // For users that can access all observations, all we need to check here is that the deployment ID(s) they have provided are for deployments that actually exist.
      // N.b. this should error if any of the deployments don't exist
      await getLevelsForDeployments(deploymentIdsToCheck);
    }

    if (!user.canAccessAllObservations) {
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
  if (!where.inDeployment && !user.canAccessAllObservations) {

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
    where.inDeployment = {
      in: deploymentIds
    };

  }

  // TODO: If the user doesn't provide specific deploymentIds then we get a list for them. This means that if isHostedBy or madeBySensor parameters are specified then no observations will be returned for these if they don't belong in the user's deployments. The question is whether we should throw an error that lets them know that the platform or sensor isn't in the list of deployments.

  // Quick safety check to make sure non-super users can't go retrieving observations without their deployments being defined.
  if (!user.canAccessAllObservations && (!where.inDeployment && !where.inDeployment.in)) {
    throw new Error(' A non-superuser is able to request observations without specifying deployments. Server code needs editing to fix this.');
  }

  const observations = await observationService.getObservations(where, options);
  const observationsForClient = observations.map(formatObservationForClient);

  const observationsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.observation
    ],
    '@id': `${config.api.base}/observations`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: observationsForClient
  };

  return observationsWithContext;

}


//-------------------------------------------------
// Get Observations from a single deployment
//-------------------------------------------------
export async function getObservationsFromSingleDeployment(deploymentId: string, where: any, options: {limit?: number; offset?: number}): Promise<any> {

  where.inDeployment = deploymentId;

  const observations = await observationService.getObservations(where, options);
  const observationsForClient = observations.map(formatObservationForClient);

  // TODO: Need to make this a JSON-LD response
  return observationsForClient;

}


//-------------------------------------------------
// Get Observations from a single platform
//-------------------------------------------------
export async function getObservationsFromSinglePlatform(where: any, options: {limit?: number; offset?: number}): Promise<any> {

  const observations = await observationService.getObservations(where, options);
  const observationsForClient = observations.map(formatObservationForClient);

  // TODO: Need to make this a JSON-LD response
  return observationsForClient;

}