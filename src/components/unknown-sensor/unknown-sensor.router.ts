//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getUnknownSensors} from './unknown-sensor.controller';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';

const router = express.Router();

export {router as UnknownSensorRouter};



//-------------------------------------------------
// Get Unknown Sensors
//-------------------------------------------------
const getUnknownSensorsQuerySchema = joi.object({
  limit: joi.number().integer().positive().max(1000),
  offset: joi.number().integer().positive(),
  sortBy: joi.string().valid('id'),
  sortOrder: joi.string().valid('asc', 'desc')
});

router.get('/unknown-sensors', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getUnknownSensorsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // TODO: Add a header to indicate that the content-type is JSON-LD?
  const jsonResponse = await getUnknownSensors(query, req.user);
  return res.json(jsonResponse);

}));

