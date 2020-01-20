//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {Unauthorized} from '../../errors/Unauthorized';
import * as check from 'check-types';
import {permissionsCheck} from '../../routes/middleware/permissions';
import {Forbidden} from '../../errors/Forbidden';
import * as logger from 'node-logger';
import {formatObservationForClient, getObservation, getObservations, deleteObservation, createObservation} from './observation.controller';
import {InvalidObservation} from './errors/InvalidObservation';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {pick} from 'lodash';
import {Promise} from 'bluebird';
import {getDeployment, getDeployments} from '../deployment/deployment.controller';
import {inConditional} from '../../utils/custom-joi-validations';
import {getLevelsForDeployments} from '../deployment/deployment-users.controller';

const router = express.Router();

export {router as ObservationRouter};


//-------------------------------------------------
// Get observations
//-------------------------------------------------
const getObservationsQuerySchema = joi.object({
  // filtering
  observedProperty: joi.string(),
  hasFeatureOfInterest: joi.string(),
  inDeployment: joi.string(),
  inDeployment_in: joi.string().custom(inConditional), // inConditional converts common-delimited string to array.
  // if you ever allow the __exists conditional then make sure it doesn't allow unauthenticed users access to get observations from restricted deployments.
  isHostedBy: joi.string(), // platform id just has to occur anywhere in the path
  isHostedBy__in: joi.string().custom(inConditional),
  hostedByPath: joi.string(), // requires an exact match for the path
  hostedByPath__in: joi.string().custom(inConditional),
  hostedByPathSpecial: joi.string(), // allows for lquery syntax
  hostedByPathSpecial__in: joi.string().custom(inConditional),
  resultTime__gt: joi.string().isoDate(),
  resultTime__gte: joi.string().isoDate(),
  resultTime__lt: joi.string().isoDate(),
  resultTime__lte: joi.string().isoDate(),
  // options
  limit: joi.number().integer().positive().max(1000),
  offset: joi.number().integer().positive()
})
.without('inDeployment', 'inDeployment__in')
.without('resultTime__gt', 'resultTime__gte')
.without('resultTime__lt', 'resultTime__lte');


router.get('/observations', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getObservationsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['limit', 'offset'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = {};
  Object.keys(query).forEach((key): void => {
    if (!optionKeys.includes(key)) {
      wherePart[key] = query[key];
    }
  });
  const where = convertQueryToWhere(wherePart);

  const userId = req.user.id;
  const hasSuperUserPermission = req.user.permissions.includes('get:observation');

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has rights to these deployment(s).
  if (where.inDeployment && !hasSuperUserPermission) {

    const deploymentIdsToCheck = check.string(where.inDeployment) ? [check.string(where.inDeployment)] : where.inDeployment.in;

    // Decided to add an event-stream that lets us check a user's rights to multiple deployments in a single request. I.e can pass a single userId (or none at all), and an array of deployment IDs, and for each we return the level of access they have. The benefit being that we have a single even stream request, with only the vital data being returned, and the sensor-deployment-manager can be setup so it only makes a single mongodb request to get info on multiple deployments. Therefore should be faster.
    let deploymentLevels;
    if (userId) {
      // N.b. this should error if any of the deployments don't exist
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck, userId);
    } else {
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck);
    }

    // If there's no level defined for any of these deployments then throw an error
    deploymentLevels.forEach((deploymentLevel): void => {
      if (!deploymentLevel.level) {
        throw new Forbidden(`You do not have the rights to access observations from the deployment '${deploymentLevel.deploymentId}'.`);
      }
    });
    
  }

  //------------------------
  // inDeployment unspecified
  //------------------------
  // If no deployment has been specified then get a list of all the public deployments and the user's own deployments.
  if (!where.inDeployment && !hasSuperUserPermission) {

    const deploymentWhere: any = {};
    if (req.user.id) where.user = req.user.id;
    const deployments = await getDeployments(deploymentWhere, {includeAllPublic: true});
    if (deployments.length === 0) {
      throw new Forbidden('You do not have access to any deployments and therefore its not possible to retrieve any observations.');
    }
    const deploymentIds = deployments.map((deployment): string => deployment.id);
    where.inDeployment = {
      in: deploymentIds
    };

  }

  if (hasSuperUserPermission) {
    // TODO: might want to check the deployments actually exist.
  }

  
  // TODO: If the user doesn't provide specific deploymentIds then we get a list for them. This means that if isHostedBy or madeBySensor parameters are specified then no observations will be returned for these if they don't belong in the user's deployments. The question is whether we should throw an error that lets them know that the platform or sensor isn't in the list of deployments.

  // Quick safety check to make sure non-super users can't go retrieving observations without their deployments being defined.
  if (!hasSuperUserPermission && (!where.inDeployment && !where.inDeployment__in)) {
    throw new Error('Non-super user is able to request observations without specifying deployments. Code needs editing to fix this.');
  }

  const observations = await getObservations(where, options);
  const observationsForClient = observations.map(formatObservationForClient);
  return res.json(observationsForClient);

}));


//-------------------------------------------------
// Get observations (specific deployment)
//-------------------------------------------------
const getDeploymentObservationsQuerySchema = joi.object({
  // filtering
  observedProperty: joi.string(),
  featureOfInterest: joi.string(),
  isHostedBy: joi.string(), // platform id just has to occur anywhere in the path
  isHostedBy__in: joi.string().custom(inConditional),
  hostedByPath: joi.string(), // requires an exact match for the path
  hostedByPath__in: joi.string().custom(inConditional),
  hostedByPathSpecial: joi.string(), // allows for lquery syntax
  hostedByPathSpecial__in: joi.string().custom(inConditional),  
  resultTime__gt: joi.string().isoDate(),
  resultTime__gte: joi.string().isoDate(),
  resultTime__lt: joi.string().isoDate(),
  resultTime__lte: joi.string().isoDate(),
  // options
  limit: joi.number().integer().positive().max(1000),
  offset: joi.number().integer().positive()
});

router.get('/deployments/:deploymentId/observations', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  const {error: queryErr, value: query} = getDeploymentObservationsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['limit', 'offset'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = {
    inDeployment: deploymentId
  };
  Object.keys(query).forEach((key): void => {
    if (!optionKeys.includes(key)) {
      wherePart[key] = query[key];
    }
  });
  const where = convertQueryToWhere(wherePart);

  const observations = await getObservations(where, options);
  const observationsForClient = observations.map(formatObservationForClient);
  return res.json(observationsForClient);  

}));


//-------------------------------------------------
// Get observation (specific platform)
//-------------------------------------------------
// TODO: i.e. /deployments/:deploymentId/platforms/:platformId/observations
const getPlatformObservationsQuerySchema = joi.object({
  // filtering
  observedProperty: joi.string(),
  featureOfInterest: joi.string(), 
  resultTime__gt: joi.string().isoDate(),
  resultTime__gte: joi.string().isoDate(),
  resultTime__lt: joi.string().isoDate(),
  resultTime__lte: joi.string().isoDate(),
  // options
  limit: joi.number().integer().positive().max(1000),
  offset: joi.number().integer().positive()
});

router.get('/deployments/:deploymentId/platforms/:platformId/observations', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;

  const {error: queryErr, value: query} = getPlatformObservationsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['limit', 'offset'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = {
    inDeployment: deploymentId
  };
  Object.keys(query).forEach((key): void => {
    if (!optionKeys.includes(key)) {
      wherePart[key] = query[key];
    }
  });
  const where = convertQueryToWhere(wherePart);

  // Adding the platform part to this where object is more complicated, as we'll actually allow the platform part of the URL to be provided in various ways, depending on the following scenarios:
  // 1. For .../platforms/van-1/observations we'll get observations with the platform 'van-1' anywhere in the path.
  // 2. For .../platforms/lamppost-1.wintersensor-abc/observations, i.e. periods, but no asterisk, then we'll assume the user wants an exact platform path match.
  // 3. For .../platforms/building-1.joe-bloggs.*/observations, i.e. contains an asterisk, then we'll assume the user has provided an lquery, in this case they want any observations from any devices joe-bloggs may have been carrying, but only whilst he was in building-1.
  const platformIdContainsPeriods = platformId.includes('.');
  const platformIdContainsAsterisk = platformId.includes('*');
  if (platformIdContainsAsterisk) {
    where.hostedByPathSpecial = platformId;
  } else if (platformIdContainsPeriods) {
    where.hostedByPath = platformId.split('.');
  } else {
    where.isHostedBy = platformId;
  }

  const observations = await getObservations(where, options);
  const observationsForClient = observations.map(formatObservationForClient);
  return res.json(observationsForClient); 

}));


//-------------------------------------------------
// Get observation
//-------------------------------------------------
router.get('/observations/:observationId', asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;
  const observation = await getObservation(observationId);

  const requiredPermission = 'get:observation';
  if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
    // Make sure the user has rights to at least one of the deployments this observation is in, or that the deployment is public.
    if (!observation.inDeployments || observation.inDeployments.length === 0) {
      throw new Forbidden('You do not have permission to see this observation. The observation does not belong to a deployment.');
    }
    const deployments = await Promise.map(observation.inDeployments, async (deploymentId): Promise<any> => {
      return await getDeployment(deploymentId);
    });
    // Are any of these deployments public or one that this user has rights too
    const match = deployments.find((deployment): any => {
      if (deployment.public === true) {
        return true;
      }
      if (req.user.id && req.deployment.users) {
        const userIds = req.deployment.users.map((user): string => user.id);
        if (userIds.includes(req.user.id)) {
          return true;
        }
      }
      return false;
    });
    if (!match) {
      throw new Forbidden('This observation does not belong to a deployment that you have access to.');
    }
  }

  const observationforClient = formatObservationForClient(observation);
  return res.json(observationforClient);

}));


//-------------------------------------------------
// Create Observation
//-------------------------------------------------
const createObservationBodySchema = joi.object({
  madeBySensor: joi.string().required(),
  // Don't want inDeployment or isHostedBy being provided here, as this should be derived from any saved context instead.
  hasResult: joi.object({
    value: joi.any().required()
  }).required(),
  resultTime: joi.string()
    .isoDate()
    .required(),
  hasFeatureOfInterest: joi.string(),
  observedProperty: joi.string(),
  usedProcedures: joi.array().items(joi.string())  
})
.required();

// This endpoint is more for superusers. If I ever want to allow standard users to contribute observation then it should be via an endpoint that includes the deployment ID in the url. 
router.post('/observations', permissionsCheck('create:observation'), asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = createObservationBodySchema.validate(req.body);
  if (queryErr) throw new InvalidObservation(queryErr.message);

  const createdObservation = await createObservation(body);
  const observationforClient = formatObservationForClient(createdObservation);
  return res.status(201).json(observationforClient);

}));



//-------------------------------------------------
// Delete Observation
//-------------------------------------------------
// This endpoint is for superusers. If users of a deployment want to delete observations from one of their deployments then they must do this via DELETE /deployments/:deploymentId/observations/:observationId.
router.delete('/observation/:observationId', permissionsCheck('delete:observation'), asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;
  await deleteObservation(observationId);
  return res.status(204).send();

}));

