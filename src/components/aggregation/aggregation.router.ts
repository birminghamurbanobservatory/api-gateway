//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {inConditional} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {getAggregations, getAggregation, createAggregation, deleteAggregation, updateAggregation} from './aggregation.controller';
import {alphanumericPlusHyphenRegex} from '../../utils/regular-expressions';

const router = express.Router();

export {router as AggregationRouter};


//-------------------------------------------------
// Create Aggregation
//-------------------------------------------------
router.post('/aggregations', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'aggregation-create-request-body');
  const jsonResponse = await createAggregation(body, req.user);
  validateAgainstSchema(jsonResponse, 'aggregation-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get Aggregation
//-------------------------------------------------
router.get('/aggregations/:aggregationId', asyncWrapper(async (req, res): Promise<any> => {

  const aggregationId = req.params.aggregationId;
  const jsonResponse = await getAggregation(aggregationId, req.user);
  validateAgainstSchema(jsonResponse, 'aggregation-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get Aggregations
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  id__begins: joi.string(),
  id__in: joi.string().custom(inConditional),
  listed: joi.boolean(),
  inCommonVocab: joi.boolean(),
  belongsToDeployment: joi.string().pattern(alphanumericPlusHyphenRegex),
  belongsToDeployment__in: joi.string().custom(inConditional),
  belongsToDeployment__exists: joi.boolean(),
  search: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
});

router.get('/aggregations', asyncWrapper(async (req, res): Promise<any> => {

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
 
  let jsonResponse = await getAggregations(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/aggregations`, query);
  validateAgainstSchema(jsonResponse, 'aggregations-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Update Aggregation
//-------------------------------------------------
router.patch('/aggregations/:aggregationId', asyncWrapper(async (req, res): Promise<any> => {

  const aggregationId = req.params.aggregationId;
  const body = validateAgainstSchema(req.body, 'aggregation-update-request-body');
  const jsonResponse = await updateAggregation(aggregationId, body, req.user);
  validateAgainstSchema(jsonResponse, 'aggregation-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete Aggregation
//-------------------------------------------------
router.delete('/aggregations/:aggregationId', asyncWrapper(async (req, res): Promise<any> => {

  const aggregationId = req.params.aggregationId;
  await deleteAggregation(aggregationId, req.user);
  return res.status(204).send();

}));