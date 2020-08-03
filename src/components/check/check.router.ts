//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {stringArrayConditional, ancestorPlatformConditional} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import * as joi from '@hapi/joi';
import {getChecks, createCheck, getCheck, deleteCheck} from './check.controller';

const router = express.Router();

export {router as CheckRouter};



//-------------------------------------------------
// Create Check
//-------------------------------------------------
router.post('/checks', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'check-create-request-body');

  const jsonResponse = await createCheck(body, req.user);
  validateAgainstSchema(jsonResponse, 'check-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get Check
//-------------------------------------------------
router.get('/checks/:checkId', asyncWrapper(async (req, res): Promise<any> => {

  const checkId = req.params.checkId;
  const jsonResponse = await getCheck(checkId, req.user);
  validateAgainstSchema(jsonResponse, 'check-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get Checks
//-------------------------------------------------
const getChecksQuerySchema = joi.object({
  id__in: joi.string().custom(stringArrayConditional),
  checkType: joi.string(),
  madeBySensor: joi.string(),
  observedProperty: joi.string(),
  unit: joi.string(),
  hasFeatureOfInterest: joi.string(),
  hasDeployment: joi.string(),
  aggregation: joi.string(),
  disciplines: joi.string().custom(stringArrayConditional), // an exact match, comma-separated. Order NOT important.
  disciplinesIncludes: joi.string(),
  ancestorPlatforms: joi.string().custom(ancestorPlatformConditional), // Exact match. Dot-separated. Order IS important.
  ancestorPlatformsIncludes: joi.string(),
  usedProcedures: joi.string().custom(stringArrayConditional), // exact match. Order IS important.
  usedProceduresIncludes: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
});

router.get('/checks', asyncWrapper(async (req, res): Promise<any> => {

  logger.debug('Raw query parameters', req.query);
  const {error: queryErr, value: query} = getChecksQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);  
  logger.debug('Validated query parameters', query);

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);
 
  let jsonResponse = await getChecks(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/checks`, query);
  validateAgainstSchema(jsonResponse, 'checks-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete Check
//-------------------------------------------------
router.delete('/checks/:checkId', asyncWrapper(async (req, res): Promise<any> => {

  const checkId = req.params.checkId;

  await deleteCheck(checkId, req.user);
  return res.status(204).send();

}));