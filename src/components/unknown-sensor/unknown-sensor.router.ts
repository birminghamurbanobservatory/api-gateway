//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getUnknownSensors} from './unknown-sensor.controller';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {config} from '../../config';
import {addMetaLinks} from '../common/add-meta-links';

const router = express.Router();

export {router as UnknownSensorRouter};



//-------------------------------------------------
// Get Unknown Sensors
//-------------------------------------------------
const getUnknownSensorsQuerySchema = joi.object({
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
});

router.get('/unknown-sensors', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getUnknownSensorsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  let jsonResponse = await getUnknownSensors(query, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/unknown-sensors`, query);

  return res.json(jsonResponse);

}));

