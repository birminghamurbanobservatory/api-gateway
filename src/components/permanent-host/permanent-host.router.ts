import * as joi from '@hapi/joi';
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {Unauthorized} from '../../errors/Unauthorized';
import {doesUserHavePermission} from '../../utils/permissions';
import {Forbidden} from '../../errors/Forbidden';
import {InvalidPermanentHost} from './errors/InvalidPermanentHost';
import {createPermanentHost, formatPermanentHostForClient} from './permanent-host.controller';

const router = express.Router();

export {router as PermanentHostRouter};


//-------------------------------------------------
// Create Permanent Host
//-------------------------------------------------
const createPermanentHostBodySchema = joi.object({
  id: joi.string(),
  name: joi.string()
    .required(),
  description: joi.string()
})
.required();

router.post('/permanent-hosts', asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Permanent host can not be created because your request has not provided any user credentials');
  }

  // Does this user have permission to do this?
  const permission = 'create:permanent-host';
  const hasPermission = await doesUserHavePermission(req.user.id, permission);
  if (!hasPermission) {
    throw new Forbidden(`You do not have permission (${permission}) to make this request.`);
  }

  const {error: bodyErr, value: body} = createPermanentHostBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidPermanentHost(bodyErr.message);

  const createdPermanentHost = await createPermanentHost(body);
  const createdPermanentHostForClient = formatPermanentHostForClient(createdPermanentHost);
  return res.status(201).json(createdPermanentHostForClient);

}));