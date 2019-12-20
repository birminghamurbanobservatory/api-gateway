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
import {getDeployment} from '../deployment/deployment.controller';

const router = express.Router();

export {router as ObservationRouter};


//-------------------------------------------------
// Get observations
//-------------------------------------------------
const getObservationsQuerySchema = joi.object({
  // filtering
  observedProperty: joi.string(),
  featureOfInterest: joi.string(),
  resultTime__gt: joi.string().isoDate(),
  endDate: joi.string().isoDate(),
  // options
  limit: joi.number().integer().positive().max(1000),
  offset: joi.number().integer().positive()
});

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

  // TODO: If inDeployment has been specified then we'll need to check that the user has rights to these deployments. If not specified then get a list of all the public deployments.
  // TODO: Or if the request has just provided the platform id(s), but no deployment id then we'll need to find which deployments these platforms are in and check the user has rights to them. The same applies if madeBySensor is provided.
  // TODO: Allow a superuser with the get:observation permission to by-pass this. 

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
// This is endpoint is for superusers. If users of a deployment want to delete observations from one of their deployments then they must do this via DELETE /deployments/:deploymentId/observations/:observationId.
router.delete('/observation/:observationId', permissionsCheck('delete:observation'), asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;
  await deleteObservation(observationId);
  return res.status(204).send();

}));

