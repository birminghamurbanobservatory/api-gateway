import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as express from 'express';
import {deploymentLevelCheck} from '../../routes/middleware/deployment-level';


const router = express.Router();

export {router as UserRouter};


//-------------------------------------------------
// Get a deployment's users
//-------------------------------------------------
router.get('/deployments/:deploymentId/users', deploymentLevelCheck(['admin', 'social']), asyncWrapper(async (req, res): Promise<any> => {
  
  // TODO: Call Auth0 to get some more meaningful user data.

  const sufficientRightLevels = ['admin', 'social'];
  if (!sufficientRightLevels.includes(req.user.deploymentLevel)) {
    throw new InsufficientDeploymentRights(`To see a deployment's users you must have sufficient rights to the deployment (i.e. ${sufficientRightLevels.join(', ')}). Your level: ${req.user.deploymentLevel}.`);
  }  

  return res.json(req.deployment.users);
}));


//-------------------------------------------------
// Leave a deployment
//-------------------------------------------------
// TODO:
// Essentially deleting yourself as a user.