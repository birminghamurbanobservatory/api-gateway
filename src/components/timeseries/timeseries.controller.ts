import {ApiUser} from '../common/api-user.class';
import * as timeseriesService from './timeseries.service';
import {createSingleTimeseriesResponse, createMultipleTimeseriesResponse} from './timeseries.formatter';
import {getDeployments, getDeployment} from '../deployment/deployment.service';
import * as check from 'check-types';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {CollectionOptions} from '../common/collection-options.class';
import {formatIndividualDeploymentCondensed} from '../deployment/deployment.formatter';
import {formatIndividualSensorCondensed} from '../sensor/sensor.formatter';
import {getSensor, getSensors} from '../sensor/sensor.service';
import {getPlatforms} from '../platform/platform.service';
import {populateIdArrayWithCollection, retrieveAllPropertyIdsFromCollection, populateIdFromCollection} from '../../utils/population-helpers';
import {formatIndividualPlatformCondensed} from '../platform/platform.formatter';
import {getDisciplines} from '../discipline/discipline.service';
import {formatIndividualDisciplineCondensed} from '../discipline/discipline.formatter';
import {getObservableProperty, getObservableProperties} from '../observable-property/observable-property.service';
import {formatIndividualObservablePropertyCondensed} from '../observable-property/observable-property.formatter';
import {getUnit, getUnits} from '../unit/unit.service';
import {formatIndividualUnitCondensed} from '../unit/unit.formatter';
import {getFeatureOfInterest, getFeaturesOfInterest} from '../feature-of-interest/feature-of-interest.service';
import {formatIndividualFeatureOfInterestCondensed} from '../feature-of-interest/feature-of-interest.formatter';
import {getProcedures} from '../procedure/procedure.service';
import {formatIndividualProcedureCondensed} from '../procedure/procedure.formatter';
import {getAggregations, getAggregation} from '../aggregation/aggregation.service';
import {formatIndividualAggregationCondensed} from '../aggregation/aggregation.formatter';
import {permissionsCheck} from '../common/permissions-check';
import * as logger from 'node-logger';



export async function getSingleTimeseries(timeseriesId: string, options: {populate?: string[]} = {}, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('get:timeseries');

  const timeseries = await timeseriesService.getSingleTimeseries(timeseriesId);

  if (!hasSuperUserPermission) {
    let hasRightsToTimeseries;

    // N.B. If the timeseries doesn't belong to any deployments, then only superusers will be able to access it.
    if (check.assigned(timeseries.hasDeployment)) {
      const deploymentsIdsForLevelChecking = [timeseries.hasDeployment];
      let deploymentLevels;
      if (user.id) {
        // N.b. this should error if any of the deployments don't exist
        deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking, user.id);
      } else {
        deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking);
      }
      // We need to check that they have rights to at least one of the deployments
      // TODO: Could simplify this, given that we know they'll only be one deployment in the array.
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

  const populateKeys = options.populate || [];

  // Populate the properties. We want it to be well populated so front-end's don't need to make many follow up requests.
  const timeseriesPopulated = await populateSingleTimeseries(timeseries, populateKeys);

  const timeseriesWithContext = createSingleTimeseriesResponse(timeseriesPopulated);
  return timeseriesWithContext;
}


// A real challenge with this is what if the resource (e.g. a sensor/platform/deployment) we're trying to populate has now been deleted. You have a few options:
// 1. Return an object with just an @id property.
// 2. Ask the sensor-deployment-manager to give us the resource even if it has been deleted.
// 3. Exclude this timeseries from the response, e.g. if the fact the resource can't be found makes the timeseries obsolete.
async function populateSingleTimeseries(timeseries: any, populateKeys?: string[]): Promise<any> {

  let keys;
  let populateEverything = false;
  if (!populateKeys) {
    populateEverything = true;
    keys = [];
    logger.debug('Populating everything');
  } else {
    keys = cloneDeep(populateKeys);
    if (keys.length === 0) {
      logger.debug('Populating no timeseries properties');
    } else {
      logger.debug(`Populating the following properties of the timeseries: ${keys.join(',')}`);
    }
  }

  const populated = cloneDeep(timeseries);

  // Deployment
  if ((populateEverything || keys.includes('hasDeployment')) && check.assigned(timeseries.hasDeployment)) {
    const deployment = await getDeployment(timeseries.hasDeployment);
    const deploymentFormatted = formatIndividualDeploymentCondensed(deployment);
    populated.hasDeployment = deploymentFormatted;
  }

  // Sensor
  if ((populateEverything || keys.includes('madeBySensor')) && check.assigned(timeseries.madeBySensor)) {
    let sensor;
    try {
      sensor = await getSensor(timeseries.madeBySensor, {includeDeleted: true});
    } catch (err) {
      if (err.statusCode === 404) {
        // The sensor may still be an "unknown sensor".
        sensor = {id: timeseries.madeBySensor};
      } else {
        throw err;
      }
    }
    const sensorFormatted = formatIndividualSensorCondensed(sensor);
    populated.madeBySensor = sensorFormatted;
  }

  // Platforms
  if ((populateEverything || keys.includes('ancestorPlatforms')) && check.assigned(timeseries.hostedByPath)) {
    const {platforms} = await getPlatforms({id: {in: timeseries.hostedByPath}}, {includeDeleted: true});
    const populatedHostedByPath = populateIdArrayWithCollection(timeseries.hostedByPath, platforms);
    populated.hostedByPath = populatedHostedByPath.map(formatIndividualPlatformCondensed);
  }

  // Observed Property
  if ((populateEverything || keys.includes('observedProperty')) && check.assigned(timeseries.observedProperty)) {
    let observedProperty;
    try {
      observedProperty = await getObservableProperty(timeseries.observedProperty);
    } catch (err) {
      if (err.statusCode === 404) {
        observedProperty = {id: timeseries.observedProperty};
      } else {
        throw err;
      }
    }
    const observedPropertyFormatted = formatIndividualObservablePropertyCondensed(observedProperty);
    populated.observedProperty = observedPropertyFormatted;
  }

  // Aggregation
  if ((populateEverything || keys.includes('aggregation')) && check.assigned(timeseries.aggregation)) {
    let aggregation;
    try {
      aggregation = await getAggregation(timeseries.aggregation);
    } catch (err) {
      if (err.statusCode === 404) {
        aggregation = {id: timeseries.aggregation};
      } else {
        throw err;
      }
    }
    const aggregationFormatted = formatIndividualUnitCondensed(aggregation);
    populated.aggregation = aggregationFormatted;
  }

  // Unit
  if ((populateEverything || keys.includes('unit')) && check.assigned(timeseries.unit)) {
    let unit;
    try {
      unit = await getUnit(timeseries.unit);
    } catch (err) {
      if (err.statusCode === 404) {
        unit = {id: timeseries.unit};
      } else {
        throw err;
      }
    }
    const unitFormatted = formatIndividualUnitCondensed(unit);
    populated.unit = unitFormatted;
  }

  // Feature of Interest
  if ((populateEverything || keys.includes('hasFeatureOfInterest')) && check.assigned(timeseries.hasFeatureOfInterest)) {
    let featureOfInterest;
    try {
      featureOfInterest = await getFeatureOfInterest(timeseries.hasFeatureOfInterest);
    } catch (err) {
      if (err.statusCode === 404) {
        featureOfInterest = {id: timeseries.hasFeatureOfInterest};
      } else {
        throw err;
      }
    }
    const featureOfInterestFormatted = formatIndividualFeatureOfInterestCondensed(featureOfInterest);
    populated.hasFeatureOfInterest = featureOfInterestFormatted;
  }

  // Disciplines
  if ((populateEverything || keys.includes('disciplines')) && check.assigned(timeseries.disciplines)) {
    const {disciplines} = await getDisciplines({id: {in: timeseries.disciplines}});
    const populatedDisciplines = populateIdArrayWithCollection(timeseries.disciplines, disciplines);
    populated.disciplines = populatedDisciplines.map(formatIndividualDisciplineCondensed);
  }

  // Used Procedures
  if ((populateEverything || keys.includes('usedProcedures')) && check.assigned(timeseries.usedProcedures)) {
    const {procedures} = await getProcedures({id: {in: timeseries.usedProcedures}});
    const populatedProcedures = populateIdArrayWithCollection(timeseries.usedProcedures, procedures);
    populated.usedProcedures = populatedProcedures.map(formatIndividualProcedureCondensed);
  }

  return populated;

}



export async function getMultipleTimeseries(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  const canGetAnyTimeseries = user.permissions.includes('get:timeseries');
  const canGetAnyDeploymentTimeseries = user.permissions.includes('get:timeseries') || user.permissions.includes('admin-all:deployments');

  const deploymentDefined = check.nonEmptyString(where.hasDeployment) || (check.nonEmptyObject(where.hasDeployment) && check.nonEmptyArray(where.hasDeployment.in));

  //------------------------
  // hasDeployment specified
  //------------------------
  // If hasDeployment has been specified then check that the user has access to these deployments.
  if (deploymentDefined && !canGetAnyDeploymentTimeseries) {

    const deploymentIdsToCheck = check.string(where.hasDeployment) ? [where.hasDeployment] : where.hasDeployment.in;

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
  // hasDeployment unspecified
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
    updatedWhere.hasDeployment = {
      in: deploymentIds
    };

  }

  // If the user only has admin rights to all deployments, but not to all timeseries (i.e. can't get timeseries without a deployment), then make sure we only return timeseries with specific deployments defined.
  if (!deploymentDefined && canGetAnyDeploymentTimeseries && !canGetAnyTimeseries) {
    updatedWhere.hasDeployment = {
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

  const populateKeys = options.populate || [];
  delete options.populate;

  const {timeseries, count, total} = await timeseriesService.getMultipleTimeseries(updatedWhere, options);

  const populatedTimeseries = await populateMultipleTimeseries(timeseries, populateKeys);
  
  const timeseriesWithContext = createMultipleTimeseriesResponse(populatedTimeseries, {count, total});
  return timeseriesWithContext;

}


async function populateMultipleTimeseries(timeseries: any[], populateKeys?: string[]): Promise<any[]> {

  let keys;
  let populateEverything = false;
  if (!populateKeys) {
    populateEverything = true;
    keys = [];
    logger.debug('Populating everything');
  } else {
    keys = cloneDeep(populateKeys);
    if (keys.length === 0) {
      logger.debug('Populating no properties of the timeseries');
    } else {
      logger.debug(`Populating the following properties of the timeseries: ${keys.join(',')}`);
    }
  }

  const populated = cloneDeep(timeseries);

  // Deployment
  const deploymentIds = retrieveAllPropertyIdsFromCollection(populated, 'hasDeployment');
  if ((populateEverything || keys.includes('hasDeployment')) && deploymentIds.length) {
    const {deployments} = await getDeployments({id: {in: deploymentIds}}, {includeDeleted: true});
    populated.forEach((ts): void => {
      if (ts.hasDeployment) {
        const populatedDeployment = populateIdFromCollection(ts.hasDeployment, deployments);
        ts.hasDeployment = formatIndividualDeploymentCondensed(populatedDeployment);
      }
    });
  }

  // Sensor
  const sensorIds = retrieveAllPropertyIdsFromCollection(populated, 'madeBySensor');
  if ((populateEverything || keys.includes('madeBySensor')) && sensorIds.length) {
    const {sensors} = await getSensors({id: {in: sensorIds}}, {includeDeleted: true});
    populated.forEach((ts): void => {
      if (ts.madeBySensor) {
        const populatedSensor = populateIdFromCollection(ts.madeBySensor, sensors);
        ts.madeBySensor = formatIndividualSensorCondensed(populatedSensor);
      }
    });
  }

  // Platforms
  const platformIds = retrieveAllPropertyIdsFromCollection(populated, 'hostedByPath');
  if ((populateEverything || keys.includes('ancestorPlatforms')) && platformIds.length) {
    const {platforms} = await getPlatforms({id: {in: platformIds}}, {includeDeleted: true});
    populated.forEach((ts): void => {
      if (ts.hostedByPath) {
        const populatedHostedByPaths = populateIdArrayWithCollection(ts.hostedByPath, platforms);
        ts.hostedByPath = populatedHostedByPaths.map(formatIndividualPlatformCondensed);
      }
    });
  }

  // Observed Property
  const observablePropertyIds = retrieveAllPropertyIdsFromCollection(populated, 'observedProperty');
  if ((populateEverything || keys.includes('observedProperty')) && observablePropertyIds.length) {
    const {observableProperties} = await getObservableProperties({id: {in: observablePropertyIds}});
    populated.forEach((ts): void => {
      if (ts.observedProperty) {
        const populatedObservableProperty = populateIdFromCollection(ts.observedProperty, observableProperties);
        ts.observedProperty = formatIndividualObservablePropertyCondensed(populatedObservableProperty);
      }
    });
  }

  // Aggregation
  const aggregationIds = retrieveAllPropertyIdsFromCollection(populated, 'aggregation');
  if ((populateEverything || keys.includes('aggregation')) && aggregationIds.length) {
    const {aggregations} = await getAggregations({id: {in: aggregationIds}});
    populated.forEach((ts): void => {
      if (ts.aggregation) {
        const populatedAggregation = populateIdFromCollection(ts.aggregation, aggregations);
        ts.aggregation = formatIndividualAggregationCondensed(populatedAggregation);
      }
    });
  }

  // Unit
  const unitIds = retrieveAllPropertyIdsFromCollection(populated, 'unit');
  if ((populateEverything || keys.includes('unit')) && unitIds.length) {
    const {units} = await getUnits({id: {in: unitIds}});
    populated.forEach((ts): void => {
      if (ts.unit) {
        const populatedunit = populateIdFromCollection(ts.unit, units);
        ts.unit = formatIndividualUnitCondensed(populatedunit);
      }
    });
  }

  // Feature of Interest
  const featureOfInterestIds = retrieveAllPropertyIdsFromCollection(populated, 'hasFeatureOfInterest');
  if ((populateEverything || keys.includes('hasFeatureOfInterest')) && featureOfInterestIds.length) {
    const {featuresOfInterest} = await getFeaturesOfInterest({id: {in: featureOfInterestIds}});
    populated.forEach((ts): void => {
      if (ts.hasFeatureOfInterest) {
        const populatedFeatureOfInterest = populateIdFromCollection(ts.hasFeatureOfInterest, featuresOfInterest);
        ts.hasFeatureOfInterest = formatIndividualFeatureOfInterestCondensed(populatedFeatureOfInterest);
      }
    });
  }

  // Disciplines
  const disciplineIds = retrieveAllPropertyIdsFromCollection(populated, 'disciplines');
  if ((populateEverything || keys.includes('disciplines')) && disciplineIds.length) {
    const {disciplines} = await getDisciplines({id: {in: disciplineIds}});
    populated.forEach((ts): void => {
      if (ts.disciplines) {
        const populatedDisciplines = populateIdArrayWithCollection(ts.disciplines, disciplines);
        ts.disciplines = populatedDisciplines.map(formatIndividualDisciplineCondensed);
      }
    });
  }

  // Used Procedures
  const usedProcedureIds = retrieveAllPropertyIdsFromCollection(populated, 'usedProcedures');
  if ((populateEverything || keys.includes('usedProcedures')) && usedProcedureIds.length) {
    const {procedures} = await getProcedures({id: {in: usedProcedureIds}});
    populated.forEach((ts): void => {
      if (ts.usedProcedures) {
        const populatedProcedures = populateIdArrayWithCollection(ts.usedProcedures, procedures);
        ts.usedProcedures = populatedProcedures.map(formatIndividualProcedureCondensed);
      }
    });
  }

  return populated;

}


//-------------------------------------------------
// Merge Timeseries
//-------------------------------------------------
export async function mergeTimeseries(goodIdToKeep: string, idsToMerge: string[], user: ApiUser): Promise<any> {

  // For now at least this is for superusers only.
  permissionsCheck(user, 'merge:timeseries');

  // TODO: At some point you may wish to allow deployment admins to merge timeseries as long as they all have the same deployment. You might also want some further checks to ensure they don't start merge timeseries with different units, etc.

  const result = await timeseriesService.mergeTimeseries(goodIdToKeep, idsToMerge);
  return result;
}



//-------------------------------------------------
// Delete Single Timeseries
//-------------------------------------------------
export async function deleteSingleTimeseries(timeseriesId: string, user: ApiUser): Promise<void> {

  // For now at least this is for superusers only.
  permissionsCheck(user, 'delete:timeseries');

  await timeseriesService.deleteSingleTimeseries(timeseriesId);
  return;
}