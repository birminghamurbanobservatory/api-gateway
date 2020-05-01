//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {InvalidBody} from '../../errors/InvalidBody';
import {inConditional} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {getDisciplines, getDiscipline} from './discipline.controller';

const router = express.Router();

export {router as DisciplineRouter};



//-------------------------------------------------
// Get Discipline
//-------------------------------------------------
router.get('/disciplines/:disciplineId', asyncWrapper(async (req, res): Promise<any> => {

  const disciplineId = req.params.disciplineId;
  const jsonResponse = await getDiscipline(disciplineId);
  // validateAgainstSchema(jsonResponse, 'discipline-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get Disciplines
//-------------------------------------------------
const getSensorsQuerySchema = joi.object({
  // id__begins: joi.string(),
  id__in: joi.string().custom(inConditional),
  // search: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  // sortBy: joi.string().valid('id').default('id'),
  // sortOrder: joi.string().valid('asc', 'desc').default('asc')
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
 
  let jsonResponse = await getDisciplines(where, options);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/disciplines`, query);
  // validateAgainstSchema(jsonResponse, 'disciplines-get-response-body');
  return res.json(jsonResponse);

}));