//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import * as check from 'check-types';
import {Forbidden} from '../../errors/Forbidden';
import * as logger from 'node-logger';
import {getObservations, getObservation, deleteObservation, createObservation} from './observation.controller';
import {InvalidObservation} from './errors/InvalidObservation';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {pick} from 'lodash';
import {Promise} from 'bluebird';
import {getDeployment, getDeployments} from '../deployment/deployment.service';
import {inConditional, ancestorPlatformConditional} from '../../utils/custom-joi-validations';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {formatObservationForClient} from './observation.formatter';


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
  inDeployment__in: joi.string().custom(inConditional), // inConditional converts common-delimited string to array.
  // if you ever allow the __exists conditional then make sure it doesn't allow unauthenticed users access to get observations from restricted deployments.
  ancestorPlatform: joi.string().custom(ancestorPlatformConditional), // for an exact match, e.g. west-school.weather-station-1 TODO: could also allow something like west-school.weather-station-1.* for a lquery style filter.
  ancestorPlatform__includes: joi.string(), // platform occurs anywhere in path, e.g. west-school
  resultTime__gt: joi.string().isoDate(),
  resultTime__gte: joi.string().isoDate(),
  resultTime__lt: joi.string().isoDate(),
  resultTime__lte: joi.string().isoDate(),
  flag__exists: joi.boolean(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().positive(),
  onePer: joi.string().valid('sensor', 'timeseries')
  // TODO: Provide a way of omitting some of the properties to save data, e.g. if they asked for discipline=meteorology then we could exclude the discipline property. Maybe have a query string parameter such as `lean=true`.
})
.without('inDeployment', 'inDeployment__in')
.without('resultTime__gt', 'resultTime__gte')
.without('resultTime__lt', 'resultTime__lte');


router.get('/observations', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getObservationsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'onePer'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = {};
  Object.keys(query).forEach((key): void => {
    if (!optionKeys.includes(key)) {
      wherePart[key] = query[key];
    }
  });
  const where = convertQueryToWhere(wherePart);

  const jsonResponse = await getObservations(where, options, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get observations (specific deployment)
//-------------------------------------------------
const getDeploymentObservationsQuerySchema = joi.object({
  // filtering
  observedProperty: joi.string(),
  featureOfInterest: joi.string(),
  discipline: joi.string(),
  // TODO: Update the following so it aligns with the getPlatforms endpoint, i.e. no hostedByPath key
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

// The user's rights to the deployment should have already been checked by the deployment router.
router.get('/deployments/:deploymentId/observations', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  const {error: queryErr, value: query} = getDeploymentObservationsQuerySchema.validate(req.query);
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

  where.inDeployment = deploymentId;

  const jsonResponse = await getObservations(where, options, req.user);

  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get observations (specific deployment platform)
//-------------------------------------------------
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

  // TODO: Add a header to indicate that the content-type is JSON-LD?
  const jsonResponse = await getObservations(where, options, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse); 

}));


//-------------------------------------------------
// Get observation
//-------------------------------------------------
router.get('/observations/:observationId', asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;

  const jsonResponse = await getObservation(observationId, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse);

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
  usedProcedure: joi.array().items(joi.string())  
})
.required();

// This endpoint is more for superusers. If I ever want to allow standard users to contribute observation then it should be via an endpoint that includes the deployment ID in the url. 
router.post('/observations', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = createObservationBodySchema.validate(req.body);
  if (queryErr) throw new InvalidObservation(queryErr.message);

  const jsonResponse = await createObservation(body, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.status(201).json(jsonResponse);

}));



//-------------------------------------------------
// Delete Observation
//-------------------------------------------------
// This endpoint is for superusers. If users of a deployment want to delete observations from one of their deployments then they must do this via DELETE /deployments/:deploymentId/observations/:observationId.
router.delete('/observation/:observationId', asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;
  await deleteObservation(observationId, req.user);
  return res.status(204).send();

}));

