import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InvalidBody} from '../../errors/InvalidBody';
import {registerToDeployment} from './register.controller';

const router = express.Router();

export {router as RegisterRouter};


//-------------------------------------------------
// Register something
//-------------------------------------------------
const registerBodySchema = joi.object({
  registrationKey: joi.string().required()
})
.required();

router.post('/deployments/:deploymentId/register', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = registerBodySchema.validate(req.body);
  if (queryErr) throw new InvalidBody(queryErr.message);

  const deploymentId = req.params.deploymentId;
  const registrationKey = body.registrationKey;

  const jsonResponse = await registerToDeployment(deploymentId, registrationKey, req.user);
  
  // TODO: For now the thing created will always be a platform, if a registration key will ever be used to register anything else (e.g. a platform), then we'll need to use a different formatter here.
  return res.status(201).json(jsonResponse);

}));