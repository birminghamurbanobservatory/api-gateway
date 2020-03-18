import {asyncWrapper} from '../../utils/async-wrapper';
import * as express from 'express';
import {getDeploymentUsers} from './users.controller';

const router = express.Router();

export {router as UserRouter};


//-------------------------------------------------
// Get a deployment's users
//-------------------------------------------------
router.get('/deployments/:deploymentId/users', asyncWrapper(async (req, res): Promise<any> => {
  
  // TODO: Call Auth0 to get some more meaningful user data.

  const deploymentId = req.params.deploymentId;

  const jsonResponse = await getDeploymentUsers(deploymentId, req.user);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Leave a deployment
//-------------------------------------------------
// TODO:
// Essentially deleting yourself as a user.