import {asyncWrapper} from '../../utils/async-wrapper';
import * as express from 'express';
import {deleteDeploymentUser, getDeploymentUsers, leaveDeployment} from './user.controller';

const router = express.Router();

export {router as UserRouter};


//-------------------------------------------------
// Get a deployment's users
//-------------------------------------------------
router.get('/deployments/:deploymentId/users', asyncWrapper(async (req, res): Promise<any> => {
  
  const deploymentId = req.params.deploymentId;

  const jsonResponse = await getDeploymentUsers(deploymentId, req.user);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete a deployment user
//-------------------------------------------------
// N.B. this is NOT how a user leaves a deployments, this is for users to remove other users from a deployment
router.delete('/deployments/:deploymentId/users/:userId', asyncWrapper(async (req, res): Promise<any> => {
  
  const deploymentId = req.params.deploymentId;
  const userId = req.params.userId;

  await deleteDeploymentUser(deploymentId, userId, req.user);
  return res.status(204).send();

}));


//-------------------------------------------------
// Leave a deployment
//-------------------------------------------------
// This IS how a user leaves a deployment
router.delete('/deployments/:deploymentId/leave', asyncWrapper(async (req, res): Promise<any> => {
  
  const deploymentId = req.params.deploymentId;

  await leaveDeployment(deploymentId, req.user);
  return res.status(204).send();

}));