import {ApiUser} from '../common/api-user.class';
import * as timeseriesService from './timeseries.service';
import {createSingleTimeseriesResponse, createMultipleTimeseriesResponse} from './timeseries.formatter';
import {getDeployments} from '../deployment/deployment.service';
import * as check from 'check-types';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {CollectionOptions} from '../common/collection-options.class';
import {formatIndividualDeploymentCondensed} from '../deployment/deployment.formatter';
import {formatIndividualSensorCondensed} from '../sensor/sensor.formatter';
import {getSensor} from '../sensor/sensor.service';



export async function getSingleTimeseries(timeseriesId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('get:timeseries');

  const timeseries = await timeseriesService.getSingleTimeseries(timeseriesId);

  if (!hasSuperUserPermission) {
    let hasRightsToTimeseries;

    // N.B. If the timeseries doesn't belong to any deployments, then only superusers will be able to access it.
    if (check.nonEmptyArray(timeseries.inDeployments)) {
      const deploymentsIdsForLevelChecking = timeseries.inDeployments;
      let deploymentLevels;
      if (user.id) {
        // N.b. this should error if any of the deployments don't exist
        deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking, user.id);
      } else {
        deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking);
      }
      // We need to check that they have rights to at least one of the deployments
      const hasRightsToAtLeastOneDeployment = deploymentLevels.some(({level}): boolean => {
        return Boolean(level);
      }); 
      if (hasRightsToAtLeastOneDeployment) {
        hasRightsToTimeseries = true;
      }
    } 

    if (!hasRightsToTimeseries) {
      throw new Forbidden('You do not have the rights to this timeseries');
    }
  }

  // Populate the properties. We want it to be well populated so front-end's don't need to make many follow up requests.
  const timeseriesPopulated = await populateSingleTimeseries(timeseries);

  const timeseriesWithContext = createSingleTimeseriesResponse(timeseriesPopulated);
  return timeseriesWithContext;
}


// A real challenge with this is what if the resource (e.g. a sensor/platform/deployment) we're trying to populate has now been deleted. You have a few options:
// 1. Return an object with just an @id property.
// 2. Ask the sensor-deployment-manager to give us the resource even if it has been deleted.
// 3. Exclude this timeseries from the response, e.g. if the fact the resource can't be found makes the timeseries obsolete.
async function populateSingleTimeseries(timeseries: any): Promise<any> {

  const populated = cloneDeep(timeseries);

  // Deployments
  if (check.nonEmptyArray(timeseries.inDeployments)) {
    const {deployments} = await getDeployments({id: {in: timeseries.inDeployments}});
    const deploymentsFormatted = deployments.map(formatIndividualDeploymentCondensed);
    populated.inDeployments = deploymentsFormatted;
  }

  // Sensor
  if (check.nonEmptyString(timeseries.madeBySensor)) {
    let sensor;
    try {
      sensor = await getSensor(timeseries.madeBySensor, {includeDeleted: true});
    } catch (err) {
      sensor = {id: timeseries.madeBySensor};
    }
    const sensorFormatted = formatIndividualSensorCondensed(sensor);
    populated.madeBySensor = sensorFormatted;
  }

  // Platforms

  // Observed Properties

  // Unit

  // Feature of Interest

  // Disciplines

  // Used Procedures

  return populated;

}



export async function getMultipleTimeseries(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  const canGetAnyTimeseries = user.permissions.includes('get:timeseries');
  const canGetAnyDeploymentTimeseries = user.permissions.includes('get:timeseries') || user.permissions.includes('admin-all:deployments');

  const deploymentDefined = check.nonEmptyString(where.inDeployment) || (check.nonEmptyObject(where.inDeployment) && check.nonEmptyArray(where.inDeployment.in));

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has access to these deployments.
  if (deploymentDefined && !canGetAnyDeploymentTimeseries) {

    const deploymentIdsToCheck = check.string(where.inDeployment) ? [where.inDeployment] : where.inDeployment.in;

    let deploymentLevels;
    if (user.id) {
      // N.b. this should error if any of the deployments don't exist
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck, user.id);
    } else {
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck);
    }

    // If there's no level defined for any of these deployments then throw an error
    deploymentLevels.forEach((deploymentLevel): void => {
      if (!deploymentLevel.level) {
        throw new Forbidden(`You do not have the rights to access timeseries from the deployment '${deploymentLevel.deploymentId}'.`);
      }
    });

  }

  //------------------------
  // inDeployment unspecified
  //------------------------
  // If no deployment has been specified then get a list of all the public deployments and the user's own deployments.
  if (!deploymentDefined && !canGetAnyDeploymentTimeseries) {

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
      throw new Forbidden('You do not have access to any deployments and therefore its not possible to retrieve any sensors.');
    }
    const deploymentIds = uniqueDeployments.map((deployment): string => deployment.id);
    updatedWhere.inDeployment = {
      in: deploymentIds
    };

  }

  // If the user only has admin rights to all deployments, but not to all timeseries (i.e. can't get timeseries without a deployment), then make sure we only return timeseries with specific deployments defined.
  if (!deploymentDefined && canGetAnyDeploymentTimeseries && !canGetAnyTimeseries) {
    updatedWhere.inDeployment = {
      exists: true
    };
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

  if (where.startDate) {
    updatedWhere.firstObs = where.startDate;
    delete updatedWhere.startDate;
  }
  if (where.endDate) {
    updatedWhere.lastObs = where.endDate;
    delete updatedWhere.endDate;
  }

  const {timeseries, count, total} = await timeseriesService.getMultipleTimeseries(updatedWhere, options);

  const populatedTimeseries = await populateMultipleTimeseries(timeseries);
  
  const timeseriesWithContext = createMultipleTimeseriesResponse(populatedTimeseries, {count, total});
  return timeseriesWithContext;

}


async function populateMultipleTimeseries(timeseries: any[]): Promise<any[]> {

  const populated = cloneDeep(timeseries);

  // TODO

  return populated;

}