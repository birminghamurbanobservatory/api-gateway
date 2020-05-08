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
import {getFeaturesOfInterest, getFeatureOfInterest, createFeatureOfInterest, deleteFeatureOfInterest, updateFeatureOfInterest} from './feature-of-interest.controller';
import {alphanumericPlusHyphenRegex} from '../../utils/regular-expressions';

const router = express.Router();

export {router as FeatureOfInterestRouter};


//-------------------------------------------------
// Create FeatureOfInterest
//-------------------------------------------------
router.post('/features-of-interest', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'feature-of-interest-create-request-body');
  const jsonResponse = await createFeatureOfInterest(body, req.user);
  validateAgainstSchema(jsonResponse, 'featureOfInterest-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get FeatureOfInterest
//-------------------------------------------------
router.get('/features-of-interest/:featureOfInterestId', asyncWrapper(async (req, res): Promise<any> => {

  const featureOfInterestId = req.params.featureOfInterestId;
  const jsonResponse = await getFeatureOfInterest(featureOfInterestId, req.user);
  validateAgainstSchema(jsonResponse, 'feature-of-interest-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get FeaturesOfInterest
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

router.get('/features-of-interest', asyncWrapper(async (req, res): Promise<any> => {

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
 
  let jsonResponse = await getFeaturesOfInterest(where, options, req.user);

  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/features-of-interest`, query);
  // validateAgainstSchema(jsonResponse, 'features-of-interest-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Update FeatureOfInterest
//-------------------------------------------------
router.patch('/features-of-interest/:featureOfInterestId', asyncWrapper(async (req, res): Promise<any> => {

  const featureOfInterestId = req.params.featureOfInterestId;
  const body = validateAgainstSchema(req.body, 'featureOfInterest-update-request-body');
  const jsonResponse = await updateFeatureOfInterest(featureOfInterestId, body, req.user);
  validateAgainstSchema(jsonResponse, 'feature-of-interest-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete FeatureOfInterest
//-------------------------------------------------
router.delete('/features-of-interest/:featureOfInterestId', asyncWrapper(async (req, res): Promise<any> => {

  const featureOfInterestId = req.params.featureOfInterestId;
  await deleteFeatureOfInterest(featureOfInterestId, req.user);
  return res.status(204).send();

}));