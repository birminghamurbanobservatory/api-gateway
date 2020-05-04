import * as joi from '@hapi/joi';
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {InvalidPermanentHost} from './errors/InvalidPermanentHost';
import {InvalidPermanentHostUpdates} from './errors/InvalidPermanentHostUpdates';
import {createPermanentHost, getPermanentHost, getPermanentHosts, deletePermanentHost, updatePermanentHost} from './permanent-host.controller';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {config} from '../../config';

const router = express.Router();

export {router as PermanentHostRouter};


//-------------------------------------------------
// Create Permanent Host
//-------------------------------------------------
const createPermanentHostBodySchema = joi.object({
  id: joi.string(),
  name: joi.string(),
  description: joi.string().allow(''),
  static: joi.boolean()
})
.or('id', 'name')
.required();

router.post('/permanent-hosts', asyncWrapper(async (req, res): Promise<any> => {

  const {error: bodyErr, value: body} = createPermanentHostBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidPermanentHost(bodyErr.message);

  const jsonResponse = await createPermanentHost(body, req.user);
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get Permanent Hosts
//-------------------------------------------------
const getPermanentHostsQuerySchema = joi.object({
  id__begins: joi.string(),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc'),
  search: joi.string()
});

router.get('/permanent-hosts', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getPermanentHostsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);

  let jsonResponse = await getPermanentHosts(where, options, req.user);
  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/permanent-hosts`, query);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get Permanent Host
//-------------------------------------------------
router.get('/permanent-hosts/:permanentHostId', asyncWrapper(async (req, res): Promise<any> => {

  const permanentHostId = req.params.permanentHostId;
  const jsonResponse = await getPermanentHost(permanentHostId, req.user);
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Update Permanent Host
//-------------------------------------------------
const updatePermanentHostBodySchema = joi.object({
  name: joi.string(),
  description: joi.string().allow(''),
  static: joi.boolean(),
  updateLocationWithSensor: joi.string().allow(null)
})
.min(1)
.required();

router.patch('/permanent-hosts/:permanentHostId', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updatePermanentHostBodySchema.validate(req.body);
  if (queryErr) throw new InvalidPermanentHostUpdates(queryErr.message);

  const permanentHostId = req.params.permanentHostId;
  const jsonResponse = await updatePermanentHost(permanentHostId, body, req.user);
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Delete Permanent Host
//-------------------------------------------------
router.delete('/permanent-hosts/:permanentHostId', asyncWrapper(async (req, res): Promise<any> => {

  const permanentHostId = req.params.permanentHostId;  

  await deletePermanentHost(permanentHostId, req.user);
  return res.status(204).send();

}));