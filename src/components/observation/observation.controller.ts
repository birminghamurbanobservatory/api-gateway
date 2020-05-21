import * as observationService from './observation.service';
import * as check from 'check-types';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {Forbidden} from '../../errors/Forbidden';
import {getDeployments} from '../deployment/deployment.service';
import {concat, uniqBy, cloneDeep, uniq} from 'lodash';
import {createObservationsResponse, createObservationResponse} from './observation.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import * as logger from 'node-logger';
import {formatIndividualObservablePropertyCondensed} from '../observable-property/observable-property.formatter';
import {getObservableProperty, getObservableProperties} from '../observable-property/observable-property.service';
import {formatIndividualUnitCondensed} from '../unit/unit.formatter';
import {getDisciplines} from '../discipline/discipline.service';
import {formatIndividualDisciplineCondensed, formatIndividualDiscipline} from '../discipline/discipline.formatter';
import {getUnit, getUnits} from '../unit/unit.service';
import {populateIdArrayWithCollection, retrieveAllPropertyIdsFromCollection, populateIdFromCollection} from '../../utils/population-helpers';
import {getFeatureOfInterest, getFeaturesOfInterest} from '../feature-of-interest/feature-of-interest.service';
import {formatIndividualProcedureCondensed} from '../procedure/procedure.formatter';
import {getProcedures} from '../procedure/procedure.service';
import {getAggregations, getAggregation} from '../aggregation/aggregation.service';
import {formatIndividualAggregationCondensed} from '../aggregation/aggregation.formatter';
import {formatIndividualFeatureOfInterestCondensed} from '../feature-of-interest/feature-of-interest.formatter';


//-------------------------------------------------
// Get observations 
//-------------------------------------------------
export async function getObservations(where: any, options: {limit?: number; offset?: number; onePer?: string; sortBy: string; sortOrder: string; populate?: string[]}, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  const deploymentDefined = check.nonEmptyString(where.hasDeployment) || (check.nonEmptyObject(where.hasDeployment) && check.nonEmptyArray(where.hasDeployment.in));

  const canAccessAllObservations = user.permissions.includes('get:observation');
  const canAccessAllDeploymentObservations = user.permissions.includes('get:observation') || user.permissions.includes('admin-all:deployments');
  // It's worth having the get:observations permission in addition to the admin-all:deployments permission as you may have users who should have access to all the observations, but not be allowed to see any of the extra data that would accessible if they were an admin to every deployment, e.g. a platform's description. Also it stops user with just the admin-all:deployments permission from getting observations not bound to a deployment.
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

  const populateKeys = options.populate || [];
  delete options.populate;

  const {observations, meta} = await observationService.getObservations(updatedWhere, options);
  const populatedObservations = await populateObservations(observations, populateKeys);
  const observationsWithContext = createObservationsResponse(populatedObservations, meta);
  return observationsWithContext;

}


//-------------------------------------------------
// Get Observation
//-------------------------------------------------
export async function getObservation(observationId, options: {populate?: string[]} = {}, user: ApiUser): Promise<any> {

  let hasSufficientRights; 
  const canAccessAllObservations = user.permissions.includes('get:observation');
  const canAccessAllDeploymentObervations = user.permissions.includes('get:observation') || user.permissions.includes('admin-all:deployments');

  const observation = await observationService.getObservation(observationId);

  if (canAccessAllObservations) {
    hasSufficientRights = true;

  } else if (canAccessAllDeploymentObervations) {
    if (observation.hasDeployment) {
      hasSufficientRights = true;
    }

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

  const populateKeys = options.populate || [];

  const populatedObservation = await populateObservation(observation, populateKeys);
  const observationWithContext = createObservationResponse(populatedObservation);
  return observationWithContext;

}


//-------------------------------------------------
// Create Observation
//-------------------------------------------------
export async function createObservation(observation, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:observation');

  // Pull the height out from the coordinates array
  if (observation.location && observation.location.geometry.coordinates.length === 3) {
    observation.location.height = observation.location.geometry.coordinates.pop();
  }

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


//-------------------------------------------------
// Populate single observation
//-------------------------------------------------
/**
 * Populates properties of the observation. I.e. converting them from having a value that is a string (the id), and converting them to objects.
 * @param observation - the observation to be populted
 * @param populateKeys - An array with the keys of the properties to be populated. When this argument is not provided it will populate everything, when it's an empty array it won't populate anything.
 */
async function populateObservation(observation: any, populateKeys?: string[]): Promise<any> {

  let keys;
  let populateEverything = false;
  if (!populateKeys) {
    populateEverything = true;
    keys = [];
    logger.debug('Populating everything');
  } else {
    keys = cloneDeep(populateKeys);
    if (keys.length === 0) {
      logger.debug('Populating no observation properties');
    } else {
      logger.debug(`Populating the following properties of the observation: ${keys.join(',')}`);
    }
  }

  const populated = cloneDeep(observation);

  // Observed Property
  if ((populateEverything || keys.includes('observedProperty')) && check.assigned(observation.observedProperty)) {
    let observedProperty;
    try {
      observedProperty = await getObservableProperty(observation.observedProperty);
    } catch (err) {
      if (err.statusCode === 404) {
        observedProperty = {id: observation.observedProperty};
      } else {
        throw err;
      }
    }
    const observedPropertyFormatted = formatIndividualObservablePropertyCondensed(observedProperty);
    populated.observedProperty = observedPropertyFormatted;
  }

  // Unit
  if ((populateEverything || keys.includes('unit')) && check.assigned(observation.hasResult.unit)) {
    let unit;
    try {
      unit = await getUnit(observation.hasResult.unit);
    } catch (err) {
      if (err.statusCode === 404) {
        unit = {id: observation.unit};
      } else {
        throw err;
      }
    }
    const unitFormatted = formatIndividualUnitCondensed(unit);
    populated.hasResult.unit = unitFormatted;
  }

  // Aggregation
  if ((populateEverything || keys.includes('aggregation')) && check.assigned(observation.aggregation)) {
    let aggregation;
    try {
      aggregation = await getAggregation(observation.aggregation);
    } catch (err) {
      if (err.statusCode === 404) {
        aggregation = {id: observation.aggregation};
      } else {
        throw err;
      }
    }
    const aggregationFormatted = formatIndividualAggregationCondensed(aggregation);
    populated.aggregation = aggregationFormatted;
  }

  // Disciplines
  if ((populateEverything || keys.includes('disciplines')) && check.assigned(observation.disciplines)) {
    const {disciplines} = await getDisciplines({id: {in: observation.disciplines}});
    const populatedDisciplines = populateIdArrayWithCollection(observation.disciplines, disciplines);
    populated.disciplines = populatedDisciplines.map(formatIndividualDisciplineCondensed);
  }

  // Feature of interest
  if ((populateEverything || keys.includes('hasFeatureOfInterest')) && check.assigned(observation.hasFeatureOfInterest)) {
    let featureOfInterest;
    try {
      featureOfInterest = await getFeatureOfInterest(observation.hasFeatureOfInterest);
    } catch (err) {
      if (err.statusCode === 404) {
        featureOfInterest = {id: observation.hasFeatureOfInterest};
      } else {
        throw err;
      }
    }
    const featureOfInterestFormatted = formatIndividualObservablePropertyCondensed(featureOfInterest);
    populated.hasFeatureOfInterest = featureOfInterestFormatted;
  }

  // Procedures
  if ((populateEverything || keys.includes('usedProcedures')) && check.assigned(observation.usedProcedures)) {
    const {procedures} = await getProcedures({id: {in: observation.usedProcedures}});
    const populatedProcedures = populateIdArrayWithCollection(observation.usedProcedures, procedures);
    populated.usedProcedures = populatedProcedures.map(formatIndividualProcedureCondensed);
  }

  return populated;

}


//-------------------------------------------------
// Populate multiple observations
//-------------------------------------------------
/**
 * Populates properties of the observations. I.e. converting them from having a value that is a string (the id), and converting them to objects.
 * @param observations - the observations to be populted
 * @param populateKeys - An array with the keys of the properties to be populated. When this argument is not provided it will populate everything, when it's an empty array it won't populate anything.
 */
async function populateObservations(observations: any[], populateKeys?: string[]): Promise<any[]> {

  let keys;
  let populateEverything = false;
  if (!populateKeys) {
    populateEverything = true;
    keys = [];
    logger.debug('Populating everything');
  } else {
    keys = cloneDeep(populateKeys);
    if (keys.length === 0) {
      logger.debug('Populating no properties of the observations');
    } else {
      logger.debug(`Populating the following properties of the observations: ${keys.join(',')}`);
    }
  }

  const populated = cloneDeep(observations);

  // TODO: Populate all these properties simultaneously.

  // Observed Property
  const observablePropertyIds = retrieveAllPropertyIdsFromCollection(populated, 'observedProperty');
  if ((populateEverything || keys.includes('observedProperty')) && observablePropertyIds.length) {
    const {observableProperties} = await getObservableProperties({id: {in: observablePropertyIds}});
    populated.forEach((obs): void => {
      if (obs.observedProperty) {
        const populatedObservableProperty = populateIdFromCollection(obs.observedProperty, observableProperties);
        obs.observedProperty = formatIndividualObservablePropertyCondensed(populatedObservableProperty);
      }
    });
  }

  // Unit
  let unitIds = populated.map((obs): string => obs.hasResult.unit).filter((id): boolean => id !== undefined);
  unitIds = uniq(unitIds);
  if ((populateEverything || keys.includes('unit')) && unitIds.length) {
    const {units} = await getUnits({id: {in: unitIds}});
    populated.forEach((obs): void => {
      if (obs.hasResult.unit) {
        const populatedUnit = populateIdFromCollection(obs.hasResult.unit, units);
        obs.hasResult.unit = formatIndividualUnitCondensed(populatedUnit);
      }
    });
  }

  // Aggregation
  let aggregationIds = populated.map((obs): string => obs.aggregation).filter((id): boolean => id !== undefined);
  aggregationIds = uniq(aggregationIds);
  if ((populateEverything || keys.includes('aggregation')) && aggregationIds.length) {
    const {aggregations} = await getAggregations({id: {in: aggregationIds}});
    populated.forEach((obs): void => {
      if (obs.aggregation) {
        const populatedAggregation = populateIdFromCollection(obs.aggregation, aggregations);
        obs.aggregation = formatIndividualAggregationCondensed(populatedAggregation);
      }
    });
  }

  // Disciplines
  const disciplineIds = retrieveAllPropertyIdsFromCollection(populated, 'disciplines');
  if ((populateEverything || keys.includes('disciplines')) && disciplineIds.length) {
    const {disciplines} = await getDisciplines({id: {in: disciplineIds}});
    populated.forEach((obs): void => {
      if (obs.disciplines) {
        const populatedDisciplines = populateIdArrayWithCollection(obs.disciplines, disciplines);
        obs.disciplines = populatedDisciplines.map(formatIndividualDisciplineCondensed);
      }
    });
  }

  // Feature of interest
  const featureOfInterestIds = retrieveAllPropertyIdsFromCollection(populated, 'hasFeatureOfInterest');
  if ((populateEverything || keys.includes('hasFeatureOfInterest')) && featureOfInterestIds.length) {
    const {featuresOfInterest} = await getFeaturesOfInterest({id: {in: featureOfInterestIds}});
    populated.forEach((obs): void => {
      if (obs.hasFeatureOfInterest) {
        const populatedFeaturesOfInterest = populateIdFromCollection(obs.hasFeatureOfInterest, featuresOfInterest);
        obs.hasFeatureOfInterest = formatIndividualFeatureOfInterestCondensed(populatedFeaturesOfInterest);
      }
    });
  }

  // Procedures
  const procedureIds = retrieveAllPropertyIdsFromCollection(populated, 'usedProcedures');
  if ((populateEverything || keys.includes('usedProcedures')) && procedureIds.length) {
    const {procedures} = await getProcedures({id: {in: procedureIds}});
    populated.forEach((obs): void => {
      if (obs.usedProcedures) {
        const populatedProcedures = populateIdArrayWithCollection(obs.usedProcedures, procedures);
        obs.usedProcedures = populatedProcedures.map(formatIndividualProcedureCondensed);
      }
    });
  }

  return populated;

}