//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {createSensor, getSensor, getSensors, deleteSensor, updateSensor} from './sensor.controller';
import {InvalidSensor} from './errors/InvalidSensor';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {SensorNotFound} from './errors/SensorNotFound';
import {Forbidden} from '../../errors/Forbidden';
import {InvalidBody} from '../../errors/InvalidBody';
import {inConditional} from '../../utils/custom-joi-validations';

const router = express.Router();

export {router as SensorRouter};


//-------------------------------------------------
// Create Sensor
//-------------------------------------------------
const configSchema = joi.object({
  hasPriority: joi.boolean().required(),
  observedProperty: joi.string().required(),
  hasFeatureOfInterest: joi.string(),
  discipline: joi.array().items(joi.string()),
  usedProcedure: joi.array().items(joi.string())
});

const createSensorBodySchema = joi.object({
  id: joi.string(), // we'll leave the model schema to check the length
  name: joi.string(),
  description: joi.string(),
  permanentHost: joi.string(),
  inDeployment: joi.string(),
  // N.B. isHostedBy is not allow here. Hosting a sensor on a platform is a separate step and depends on whether the sensor has a permanentHost or not. 
  initialConfig: joi.array().items(configSchema)
  // No need to specify the currentConfig, because the sensor-deployment-mananger will handle this.
})
.or('id', 'inDeployment')
// If an ID isn't provided, then inDeployment must be, as this indicates that a deployment sensor is being created.
.without('inDeployment', 'permanentHost')
// I don't want inDeployment and permanentHost to be set at the same time. Is the sensor has a permanentHost then the mechanism for adding the sensor to a deployment is via a registration key.
.required();

router.post('/sensors', asyncWrapper(async (req, res): Promise<any> => {

  // Let's catch an invalid sensor early, i.e. before calling the event stream.
  const {error: bodyErr, value: body} = createSensorBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidSensor(bodyErr.message);  

  const jsonResponse = await createSensor(body, req.user);
  return res.status(201).json(jsonResponse);

}));



//-------------------------------------------------
// Get Sensor
//-------------------------------------------------
router.get('/sensors/:sensorId', asyncWrapper(async (req, res): Promise<any> => {

  const sensorId = req.params.sensorId;
  const jsonResponse = await getSensor(sensorId, req.user);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get Sensors
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  inDeployment: joi.string(),
  inDeployment__in: joi.string().custom(inConditional), // inConditional converts common-delimited string to array.
  inDeployment__exists: joi.boolean(),
  isHostedBy: joi.string(),
  isHostedBy__exists: joi.boolean(),
  permanentHost: joi.string(),
  permanentHost__exists: joi.boolean(),
  hasFeatureOfInterest: joi.string(),
  observedProperty: joi.string(),
  id__begins: joi.string
})
.without('inDeployment__exists', ['inDeployment'])
.without('inDeployment__exists', ['inDeployment__in'])
.without('inDeployment__in', ['inDeployment'])
.without('isHostedBy__exists', ['isHostedBy'])
.without('permanentHost__exists', ['permanentHost'])
.required();

// Can't see a reason why not to use get:sensor as permission to get either a single or multiple sensors.
router.get('/sensors', asyncWrapper(async (req, res): Promise<any> => {

  logger.debug('Raw query parameters', req.query);
  const {error: queryErr, value: query} = getSensorsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);  
  logger.debug('Validated query parameters', query);

  const where = convertQueryToWhere(query);
  // TODO: At some point you may start needing to limit the number of sensors returned, e.g. allowing a user to provide a query parameter: limit=100, when this becomes the case you'll want to create an options argument for the getSensors function and for the event stream call, e.g. {limit: 100}, otherwise this could get messy trying to combine it with the where object.

  const jsonResponse = await getSensors(where, req.user);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Update sensor (superusers only)
//-------------------------------------------------
const updateSensorBodySchema = joi.object({
  name: joi.string(),
  description: joi.string(),
  inDeployment: joi.string().allow(null),
  permanentHost: joi.string().allow(null),
  initialConfig: joi.array().items(configSchema),
  currentConfig: joi.array().items(configSchema)
  // N.B. this isn't where the isHostedBy can be changed, for sensors on permanentHosts this is changed during registration, and for deployment sensors this is handled at an endpoint with the deploymentId in the path.
})
.min(1)
.required(); 

router.patch('/sensors/:sensorId', asyncWrapper(async (req, res): Promise<any> => {

  const {error: bodyErr, value: body} = updateSensorBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidBody(bodyErr.message);

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
// 1. id - this will be auto-assigned to ensure it has a "ds-" prefix to avoid clashes with non-deployment-sensor ids.
// 2. inDeployment - this should come from the url path.
// 3. permanentHost - deployment-bound sensors should not have a permanentHost.
// N.B. allow the sensor will be created at /deployments/.../sensors, it's @id will be at /sensors like every other sensor.


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
//   if (sensor.inDeployment !== deploymentId) {
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
// Your bog standard deployment users won't be able to update much of a sensors details (even if they are an admin of the deployment). For example its name and description have come from whichever superuser created the sensor in the first place and thus a deployment user can't edit them. 
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

