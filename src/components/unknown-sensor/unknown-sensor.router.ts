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
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {pick} from 'lodash';

const router = express.Router();

export {router as UnknownSensorRouter};



//-------------------------------------------------
// Get Unknown Sensors
//-------------------------------------------------
const getUnknownSensorsQuerySchema = joi.object({
  // where
  search: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
});

router.get('/unknown-sensors', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getUnknownSensorsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = {};
  Object.keys(query).forEach((key): void => {
    if (!optionKeys.includes(key)) {
      wherePart[key] = query[key];
    }
  });
  const where = convertQueryToWhere(wherePart);

  let jsonResponse = await getUnknownSensors(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/unknown-sensors`, query);

  return res.json(jsonResponse);

}));

