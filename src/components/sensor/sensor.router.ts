//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {createSensor, getSensor, getSensors, formatSensorForClient} from './sensor.controller';
import {InvalidSensor} from './errors/InvalidSensor';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {permissionsCheck} from '../../routes/middleware/permissions';

const router = express.Router();

export {router as SensorRouter};


//-------------------------------------------------
// Create Sensor
//-------------------------------------------------
const defaultObjectSchema = joi.object({
  value: joi.string(),
  ifs: joi.array() // TODO: add more details here.
});

const createSensorBodySchema = joi.object({
  id: joi.string(),
  name: joi.string(),
  description: joi.string(),
  inDeployment: joi.string(),
  permanentHost: joi.string(),
  defaults: joi.object({
    hasFeatureOfInterest: defaultObjectSchema,
    observedProperty: defaultObjectSchema
  }),
})
.required();

router.post('/sensors', permissionsCheck('create:sensor'), asyncWrapper(async (req, res): Promise<any> => {

  // Let's catch an invalid sensor early, i.e. before calling the event stream.
  const {error: bodyErr, value: body} = createSensorBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidSensor(bodyErr.message);  

  const createdSensor = await createSensor(body);
  const createdSensorForClient = formatSensorForClient(createdSensor);
  return res.status(201).json(createdSensorForClient);

}));


//-------------------------------------------------
// Get Sensor
//-------------------------------------------------
router.get('/sensors/:sensorId', permissionsCheck('get:sensor'), asyncWrapper(async (req, res): Promise<any> => {

  const sensorId = req.params.sensorId;
  const sensor = await getSensor(sensorId);
  return res.json(sensor);

}));


//-------------------------------------------------
// Get Sensors
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  inDeployment: joi.string(),
  inDeployment__isDefined: joi.boolean(), // TODO: rename this __exists?
  isHostedBy: joi.string(),
  isHostedBy__isDefined: joi.boolean(),
  permanentHost: joi.string(),
  permanentHost__isDefined: joi.boolean(),
  hasFeatureOfInterest: joi.string(),
  observedProperty: joi.string(),
})
.without('inDeployment__isDefined', ['inDeployment'])
.without('isHostedBy__isDefined', ['isHostedBy'])
.without('permanentHost__isDefined', ['permanentHost'])
.required();

// Can't see a reason why not to use get:sensor as permission to get either a single or multiple sensors.
router.get('/sensors', permissionsCheck('get:sensor'), asyncWrapper(async (req, res): Promise<any> => {

  logger.debug('Raw query parameters', req.query);
  const {error: queryErr, value: query} = getSensorsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);  
  logger.debug('Validated query parameters', query);

  const where = convertQueryToWhere(query);
  // TODO: At some point you may start needing to limit the number of sensors returned, e.g. allowing a user to provide a query parameter: limit=100, when this becomes the case you'll want to create an options argument for the getSensors function and for the event stream call, e.g. {limit: 100}, otherwise this could get messy trying to combine it with the where object.

  const sensors = await getSensors(where);
  return res.json(sensors);

}));


//-------------------------------------------------
// Update sensor
//-------------------------------------------------
// i.e. PATCH /sensors/:sensorId (for superusers only)


//-------------------------------------------------
// Update sensor (deployment user)
//-------------------------------------------------
// Your bog standard deployment users won't be able to update much of a sensors details (even if they are an admin of the deployment). For example its name and description have come from whichever superuser created the sensor in the first place and thus a deployment user can't edit them. However this is a good endpoint from which to allow users to edit some of the context properties of a sensor. E.g. its current observed property and feature of interest. E.g.
// PATCH /deployments/:deploymentId/sensors/:sensorID with body {observedProperty: 'temperature'};
// Behind the scenes this won't update defaults object in the sensor document, but instead will create a new live context document for this sensor.


