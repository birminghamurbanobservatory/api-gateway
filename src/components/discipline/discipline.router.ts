//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {stringArrayConditional} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {getDisciplines, getDiscipline, createDiscipline, deleteDiscipline, updateDiscipline} from './discipline.controller';
import {alphanumericPlusHyphenRegex} from '../../utils/regular-expressions';

const router = express.Router();

export {router as DisciplineRouter};


//-------------------------------------------------
// Create Discipline
//-------------------------------------------------
router.post('/disciplines', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'discipline-create-request-body');
  const jsonResponse = await createDiscipline(body, req.user);
  validateAgainstSchema(jsonResponse, 'discipline-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get Discipline
//-------------------------------------------------
router.get('/disciplines/:disciplineId', asyncWrapper(async (req, res): Promise<any> => {

  const disciplineId = req.params.disciplineId;
  const jsonResponse = await getDiscipline(disciplineId, req.user);
  validateAgainstSchema(jsonResponse, 'discipline-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get Disciplines
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  id__begins: joi.string(),
  id__in: joi.string().custom(stringArrayConditional),
  listed: joi.boolean(),
  inCommonVocab: joi.boolean(),
  belongsToDeployment: joi.string().pattern(alphanumericPlusHyphenRegex),
  belongsToDeployment__in: joi.string().custom(stringArrayConditional),
  belongsToDeployment__exists: joi.boolean(),
  search: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
});

router.get('/disciplines', asyncWrapper(async (req, res): Promise<any> => {

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
 
  let jsonResponse = await getDisciplines(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/disciplines`, query);
  validateAgainstSchema(jsonResponse, 'disciplines-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Update Discipline
//-------------------------------------------------
router.patch('/disciplines/:disciplineId', asyncWrapper(async (req, res): Promise<any> => {

  const disciplineId = req.params.disciplineId;
  const body = validateAgainstSchema(req.body, 'discipline-update-request-body');
  const jsonResponse = await updateDiscipline(disciplineId, body, req.user);
  validateAgainstSchema(jsonResponse, 'discipline-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete Discipline
//-------------------------------------------------
router.delete('/disciplines/:disciplineId', asyncWrapper(async (req, res): Promise<any> => {

  const disciplineId = req.params.disciplineId;
  await deleteDiscipline(disciplineId, req.user);
  return res.status(204).send();

}));