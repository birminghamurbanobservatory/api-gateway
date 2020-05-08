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
import {getUsedProcedures, getUsedProcedure, createUsedProcedure} from './used-procedure.controller';

const router = express.Router();

export {router as UsedProcedureRouter};


//-------------------------------------------------
// Create Used Procedure
//-------------------------------------------------
router.post('/used-procedure', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'used-procedure-create-request-body');
  const jsonResponse = await createUsedProcedure(body, req.user);
  validateAgainstSchema(jsonResponse, 'used-procedure-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get UsedProcedure
//-------------------------------------------------
router.get('/used-procedures/:usedProcedureId', asyncWrapper(async (req, res): Promise<any> => {

  const usedProcedureId = req.params.usedProcedureId;
  const jsonResponse = await getUsedProcedure(usedProcedureId, req.user);
  validateAgainstSchema(jsonResponse, 'used-procedure-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get UsedProcedures
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  id__begins: joi.string(),
  id__in: joi.string().custom(inConditional),
  listed: joi.boolean(),
  inCommonVocab: joi.boolean(),
  belongsToDeployment: joi.string(),
  belongsToDeployment__in: joi.string().custom(inConditional),
  search: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
});

router.get('/used-procedures', asyncWrapper(async (req, res): Promise<any> => {

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
 
  let jsonResponse = await getUsedProcedures(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/used-procedures`, query);
  // validateAgainstSchema(jsonResponse, 'usedProcedures-get-response-body');
  return res.json(jsonResponse);

}));