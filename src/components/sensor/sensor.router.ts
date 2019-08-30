//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as check from 'check-types';
import {Unauthorized} from '../../errors/Unauthorized';
import {createSensor, getSensor, getSensors} from './sensor.controller';
import {Forbidden} from '../../errors/Forbidden';
import {doesUserHavePermission} from '../../utils/permissions';
import {InvalidSensor} from './errors/InvalidSensor';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';

const router = express.Router();

export {router as SensorRouter};


//-------------------------------------------------
// Create Sensor
//-------------------------------------------------
// TODO: Add middleware here that checks that the request has sufficient authentication crediential to identify this user as having rights to create a new sensor. Crucially I only want specific Urban Observatory team members being able to create a new sensor.
const createSensorBodySchema = joi.object({
  id: joi.string()
    .required(),
  description: joi.string(),
  hasFeatureOfInterest: joi.string()
  .required(),
  observedProperty: joi.string()
    .required(),
  inDeployment: joi.string(),
  isHostedBy: joi.string(),
  registrationKey: joi.string()
})
.required();

router.post('/sensors', asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Sensor can not be created because your request has not provided any user credentials');
  }

  // Does this user have permission to do this
  const permission = 'create:sensor';
  const hasPermission = await doesUserHavePermission(req.user.id, permission);
  if (!hasPermission) {
    throw new Forbidden(`You do not have permission (${permission}) to make this request.`);
  }

  // Let's catch an invalid sensor early, i.e. before calling the event stream.
  const {error: bodyErr, value: body} = joi.validate(req.body, createSensorBodySchema);
  if (bodyErr) throw new InvalidSensor(bodyErr.message);  

  const createdSensor = await createSensor(body);
  return res.status(201).json(createdSensor);

}));


//-------------------------------------------------
// Get Sensor
//-------------------------------------------------
router.get('/sensors/:sensorId', asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Can not get sensor because your request has not provided any user credentials');
  }

  // Does this user have permission to do this - this is import as I don't want unauthorised users finding out the registration key.
  const permission = 'get:sensor';
  const hasPermission = await doesUserHavePermission(req.user.id, permission);
  if (!hasPermission) {
    throw new Forbidden(`You do not have permission (${permission}) to make this request.`);
  }

  const sensorId = req.params.sensorId;
  const sensor = await getSensor(sensorId);
  return res.json(sensor);

}));


//-------------------------------------------------
// Get Sensors
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  inDeployment: joi.alternatives().try(
    joi.boolean().valid(false),
    joi.string()
  ),
  isHostedBy: joi.alternatives().try(
    joi.boolean().valid(false),
    joi.string()
  ),
  permanentHost: joi.alternatives().try(
    joi.boolean().valid(false),
    joi.string()
  ),
  hasFeatureOfInterest: joi.string(),
  observedProperty: joi.string(),
})
.required();

router.get('/sensors', asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Can not get sensors because your request has not provided any user credentials');
  }

  // Does this user have permission to do this - this is import as I don't want unauthorised users finding out the registration keys.
  const permission = 'get:sensors';
  const hasPermission = await doesUserHavePermission(req.user.id, permission);
  if (!hasPermission) {
    throw new Forbidden(`You do not have permission (${permission}) to make this request.`);
  }

  logger.debug('Raw query parameters', req.query);
  const {error: queryErr, value: query} = joi.validate(req.query, getSensorsQuerySchema);
  if (queryErr) throw new InvalidQueryString(queryErr.message);  
  logger.debug('Validated query parameters', query);

  const sensors = await getSensors(query);
  return res.json(sensors);

}));

