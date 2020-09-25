//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {acceptDeploymentInvite, createDeploymentInvite, getDeploymentInvite} from './deployment-invite.controller';


const router = express.Router();

export {router as DeploymentInviteRouter};


//-------------------------------------------------
// Create Deployment Invite
//-------------------------------------------------
router.post('/deployments/:deploymentId/invites', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const body = validateAgainstSchema(req.body, 'deployment-invite-create-request-body');
  
  const jsonResponse = await createDeploymentInvite(deploymentId, body, req.user);
  validateAgainstSchema(jsonResponse, 'deployment-invite-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get Deployment Invite
//-------------------------------------------------
router.get('/deployment-invites/:inviteId', asyncWrapper(async (req, res): Promise<any> => {

  const inviteId = req.params.inviteId;
  
  const jsonResponse = await getDeploymentInvite(inviteId);
  validateAgainstSchema(jsonResponse, 'deployment-invite-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Accept Deployment Invite
//-------------------------------------------------
router.post('/deployment-invites/:inviteId', asyncWrapper(async (req, res): Promise<any> => {

  const inviteId = req.params.inviteId;

  const jsonResponse = await acceptDeploymentInvite(inviteId, req.user);
  // N.B. we're returning the deployment they now have access to.
  validateAgainstSchema(jsonResponse, 'deployment-get-response-body');
  return res.json(jsonResponse);

}));