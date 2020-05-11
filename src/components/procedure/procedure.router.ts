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
import {getProcedures, getProcedure, createProcedure, deleteProcedure, updateProcedure} from './procedure.controller';
import {alphanumericPlusHyphenRegex} from '../../utils/regular-expressions';

const router = express.Router();

export {router as ProcedureRouter};


//-------------------------------------------------
// Create Procedure
//-------------------------------------------------
router.post('/procedures', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'procedure-create-request-body');
  const jsonResponse = await createProcedure(body, req.user);
  validateAgainstSchema(jsonResponse, 'procedure-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get Procedure
//-------------------------------------------------
router.get('/procedures/:procedureId', asyncWrapper(async (req, res): Promise<any> => {

  const procedureId = req.params.procedureId;
  const jsonResponse = await getProcedure(procedureId, req.user);
  validateAgainstSchema(jsonResponse, 'procedure-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get Procedures
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  id__begins: joi.string(),
  id__in: joi.string().custom(inConditional),
  listed: joi.boolean(),
  inCommonVocab: joi.boolean(),
  belongsToDeployment: joi.string().pattern(alphanumericPlusHyphenRegex),
  belongsToDeployment__in: joi.string().custom(inConditional),
  search: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
});

router.get('/procedures', asyncWrapper(async (req, res): Promise<any> => {

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
 
  let jsonResponse = await getProcedures(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/procedures`, query);
  validateAgainstSchema(jsonResponse, 'procedures-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Update Procedure
//-------------------------------------------------
router.patch('/procedures/:procedureId', asyncWrapper(async (req, res): Promise<any> => {

  const procedureId = req.params.procedureId;
  const body = validateAgainstSchema(req.body, 'procedure-update-request-body');
  const jsonResponse = await updateProcedure(procedureId, body, req.user);
  validateAgainstSchema(jsonResponse, 'procedure-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete Procedure
//-------------------------------------------------
router.delete('/procedures/:procedureId', asyncWrapper(async (req, res): Promise<any> => {

  const procedureId = req.params.procedureId;
  await deleteProcedure(procedureId, req.user);
  return res.status(204).send();

}));