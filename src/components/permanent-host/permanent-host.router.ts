import * as joi from '@hapi/joi';
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {InvalidPermanentHost} from './errors/InvalidPermanentHost';
import {createPermanentHost, formatPermanentHostForClient, getPermanentHost, getPermanentHosts, deletePermanentHost} from './permanent-host.controller';
import {permissionsCheck} from '../../routes/middleware/permissions';

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
router.get('/permanent-hosts', permissionsCheck('get:permanent-host'), asyncWrapper(async (req, res): Promise<any> => {

  const permanentHosts = await getPermanentHosts();
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
// TODO



//-------------------------------------------------
// Delete Permanent Host
//-------------------------------------------------
router.delete('/permanent-hosts/:permanentHostId', permissionsCheck('delete:permanent-host'), asyncWrapper(async (req, res): Promise<any> => {

  const permanentHostId = req.params.permanentHostId;  

  await deletePermanentHost(permanentHostId);
  return res.status(204).send();

}));