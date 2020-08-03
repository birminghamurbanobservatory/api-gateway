//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {createSensor, getSensor, getSensors, deleteSensor, updateSensor} from './sensor.controller';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {stringArrayConditional} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';

const router = express.Router();

export {router as SensorRouter};


//-------------------------------------------------
// Create Sensor
//-------------------------------------------------
router.post('/sensors', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'sensor-create-request-body');
  // N.B. the sensor-deployment-manager will handle the more complex checks

  const jsonResponse = await createSensor(body, req.user);
  validateAgainstSchema(jsonResponse, 'sensor-get-response-body');
  return res.status(201).json(jsonResponse);

}));



//-------------------------------------------------
// Get Sensor
//-------------------------------------------------
router.get('/sensors/:sensorId', asyncWrapper(async (req, res): Promise<any> => {

  const sensorId = req.params.sensorId;
  const jsonResponse = await getSensor(sensorId, req.user);
  validateAgainstSchema(jsonResponse, 'sensor-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get Sensors
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  id__begins: joi.string(),
  id__in: joi.string().custom(stringArrayConditional),
  hasDeployment: joi.string(),
  hasDeployment__in: joi.string().custom(stringArrayConditional), // stringArrayConditional converts common-delimited string to array.
  hasDeployment__exists: joi.boolean(),
  isHostedBy: joi.string(),
  isHostedBy__exists: joi.boolean(),
  permanentHost: joi.string(),
  permanentHost__exists: joi.boolean(),
  search: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
})
.without('hasDeployment__exists', ['hasDeployment'])
.without('hasDeployment__exists', ['hasDeployment__in'])
.without('hasDeployment__in', ['hasDeployment'])
.without('isHostedBy__exists', ['isHostedBy'])
.without('permanentHost__exists', ['permanentHost'])
.required();

// Can't see a reason why not to use get:sensor as permission to get either a single or multiple sensors.
router.get('/sensors', asyncWrapper(async (req, res): Promise<any> => {

  logger.debug('Raw query parameters', req.query);
  const {error: queryErr, value: query} = getSensorsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);  
  logger.debug('Validated query parameters', query);

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);
 
  let jsonResponse = await getSensors(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/sensors`, query);
  validateAgainstSchema(jsonResponse, 'sensors-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Update sensor (superusers only)
//-------------------------------------------------
router.patch('/sensors/:sensorId', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'sensor-update-request-body');
  // N.B. the sensor-deployment-manager will handle the more complex checks

  const sensorId = req.params.sensorId;

  const jsonResponse = await updateSensor(sensorId, body, req.user);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete Sensor
//-------------------------------------------------
// This endpoint is for superusers not standard users to delete a sensor. 
router.delete('/sensors/:sensorId', asyncWrapper(async (req, res): Promise<any> => {

  const sensorId = req.params.sensorId;

  await deleteSensor(sensorId, req.user);
  return res.status(204).send();

}));



//-------------------------------------------------
// Create a deployment sensor
//-------------------------------------------------
// For non-superusers to create sensors that belong to a deployment
// /deployments/:deploymentId/sensors
// TODO: Do not allow the following properties to be set via this endpoint:
// 1. id - this will be auto-assigned to ensure it has a special suffix to avoid clashes with non-deployment-sensor ids.
// 2. hasDeployment - this should come from the url path.
// 3. permanentHost - deployment-bound sensors should not have a permanentHost.
// N.B. althoughß the sensor will be created at /deployments/.../sensors, it's @id will be at /sensors like every other sensor.


//-------------------------------------------------
// Get a Deployment's sensors
//-------------------------------------------------
// TODO
// For standard users to get a list of sensors in a particular deployment
// /deployments/:deploymentId/sensors



// //-------------------------------------------------
// // For any deployment sensor endpoints
// //-------------------------------------------------
// router.use('/deployments/:deploymentId/sensors/:sensorId', asyncWrapper(async (req, res, next): Promise<any> => {

//   const deploymentId = req.params.deploymentId;
//   const sensorId = req.params.sensorId;

//   // Get the sensor to check it actually exists
//   const sensor = await getSensor(sensorId);

//   // Check the sensor actually belongs to this deployment
//   if (sensor.hasDeployment !== deploymentId) {
//     throw new SensorNotFound(`Sensor '${sensorId}' does not belong to the deployment '${deploymentId}'.`);
//   }

//   logger.debug(`Platform ${sensorId} has been confirmed as belonging to deployment ${deploymentId}`);

//   req.sensor = sensor;

//   next();

// }));


//-------------------------------------------------
// Get Sensor (in deployment)
//-------------------------------------------------
// For a standard user to get sensors details. 
// You'll probably want to remove the initialConfig object for these standard users, and just return the currentConfig instead.



//-------------------------------------------------
// Update sensor (deployment user)
//-------------------------------------------------
// PATCH /deployments/:deploymentId/sensors/:sensorId
// TODO: Check that the sensor isn't bound to a permanentHost, if so you should forbid all except the currentConfig from being updated. This endpoint is more for updating sensors that are bound to a deployment.
// Your bog standard deployment users won't be able to update much of a sensors details (even if they are an admin of the deployment). For example its label and description have come from whichever superuser created the sensor in the first place and thus a deployment user can't edit them. 
// Here the user won't be able to update the initialConfig, however they can update the currentConfig, which will in turn affect which context properties are added to this sensor's incoming observations.



// //-------------------------------------------------
// // Delete Sensor from Deployment
// //-------------------------------------------------
// // This is fundamentally different from the DELETE /sensors/:sensorId endpoint above. This is for standard users to delete "deployment sensors". I.e. sensors created by a users for a specific deployment. 
// // Therefore what it CAN'T delete are sensors bound to a permanent host. If a user wants to remove a permantly hosted sensor from a deployment then they'll have to delete its platform instead.
// router.delete('/deployments/:deploymentId/sensors/:sensorId', deploymentLevelCheck(['admin', 'engineer']), asyncWrapper(async (req, res): Promise<any> => {

//   const sensorId = req.params.sensorId;

//   if (req.sensor.permanentHost) {
//     throw new Forbidden(`It is not possible to delete sensor '${sensorId}' because it is permantly bound to platform ${req.sensor.isHostedBy}. Try deleting the whole platform instead.`);
//   }

//   await deleteSensor(sensorId);
//   return res.status(204).send();

// }));

