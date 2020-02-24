import * as joi from '@hapi/joi';
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {InvalidPermanentHost} from './errors/InvalidPermanentHost';
import {InvalidPermanentHostUpdates} from './errors/InvalidPermanentHostUpdates';
import {createPermanentHost, formatPermanentHostForClient, getPermanentHost, getPermanentHosts, deletePermanentHost, updatePermanentHost} from './permanent-host.controller';
import {permissionsCheck} from '../../routes/middleware/permissions';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {pick} from 'lodash';

const router = express.Router();

export {router as PermanentHostRouter};


//-------------------------------------------------
// Create Permanent Host
//-------------------------------------------------
const createPermanentHostBodySchema = joi.object({
  id: joi.string(),
  name: joi.string()
    .required(),
  description: joi.string(),
  static: joi.boolean()
})
.required();

router.post('/permanent-hosts', permissionsCheck('create:permanent-host'), asyncWrapper(async (req, res): Promise<any> => {

  const {error: bodyErr, value: body} = createPermanentHostBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidPermanentHost(bodyErr.message);

  const createdPermanentHost = await createPermanentHost(body);
  const createdPermanentHostForClient = formatPermanentHostForClient(createdPermanentHost);
  return res.status(201).json(createdPermanentHostForClient);

}));


//-------------------------------------------------
// Get Permanent Hosts
//-------------------------------------------------
const getPermanentHostsQuerySchema = joi.object({
  id__begins: joi.string()
});

router.get('/permanent-hosts', permissionsCheck('get:permanent-host'), asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getPermanentHostsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  const whereKeys = ['id__begins'];
  const where = convertQueryToWhere(pick(query, whereKeys));

  const permanentHosts = await getPermanentHosts(where);
  const permanentHostsForClient = permanentHosts.map(formatPermanentHostForClient);
  return res.json(permanentHostsForClient);

}));


//-------------------------------------------------
// Get Permanent Host
//-------------------------------------------------
router.get('/permanent-hosts/:permanentHostId', permissionsCheck('get:permanent-host'), asyncWrapper(async (req, res): Promise<any> => {

  const permanentHostId = req.params.permanentHostId;
  const permanentHost = await getPermanentHost(permanentHostId);
  const permanentHostForClient = formatPermanentHostForClient(permanentHost);
  return res.status(201).json(permanentHostForClient);

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

router.patch('/permanent-hosts/:permanentHostId', permissionsCheck('update:permanent-host'), asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updatePermanentHostBodySchema.validate(req.body);
  if (queryErr) throw new InvalidPermanentHostUpdates(queryErr.message);

  const permanentHostId = req.params.permanentHostId;
  const updatedPermanentHost = await updatePermanentHost(permanentHostId, body);
  const permanentHostforClient = formatPermanentHostForClient(updatedPermanentHost);
  return res.json(permanentHostforClient);

}));



//-------------------------------------------------
// Delete Permanent Host
//-------------------------------------------------
router.delete('/permanent-hosts/:permanentHostId', permissionsCheck('delete:permanent-host'), asyncWrapper(async (req, res): Promise<any> => {

  const permanentHostId = req.params.permanentHostId;  

  await deletePermanentHost(permanentHostId);
  return res.status(204).send();

}));