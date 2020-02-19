//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {permissionsCheck} from '../../routes/middleware/permissions';
import {getUnknownSensors, formatUnknownSensorForClient} from './unknown-sensor.controller';

const router = express.Router();

export {router as UnknownSensorRouter};



//-------------------------------------------------
// Get Sensor
//-------------------------------------------------
router.get('/unknown-sensors', permissionsCheck('get:unknown-sensor'), asyncWrapper(async (req, res): Promise<any> => {

  const unknownSensors = await getUnknownSensors();
  const unknownSensorsForClient = unknownSensors.map(formatUnknownSensorForClient);
  return res.json(unknownSensorsForClient);

}));

