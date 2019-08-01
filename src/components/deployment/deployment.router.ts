//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments, getDeployment, createDeployment, checkRightsToDeployment} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get all
//-------------------------------------------------
router.get('/deployments', asyncWrapper(async (req, res): Promise<any> => {
  const deployments = await getDeployments();
  return res.json(deployments);
}));


//-------------------------------------------------
// Specific Deployment Request
//-------------------------------------------------
// Whenever a request comes in for a specific deployment we need to check that the user has rights to this deployment first.
// N.B. a trade off is made: we accept that making an extra event-stream request here will add to the total response time, however the the benefit is it saves us having to add the userId to any later event stream request which in turn would add extra logic to handlers of these events. 
router.use('/deployments/:deploymentId', asyncWrapper(async (req, res, next): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  let right;
  if (req.user && req.userId) {
    right = await checkRightsToDeployment(deploymentId, req.user.id);
  } else {
    right = await checkRightsToDeployment(deploymentId);
  }

  req.right = right;

  next();

}));


//-------------------------------------------------
// Get single
//-------------------------------------------------
router.get('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {
  const deploymentId = req.params.deploymentId;
  const deployments = await getDeployment(deploymentId);
  return res.json(deployments);
}));


//-------------------------------------------------
// Create Deployment
//-------------------------------------------------
// TODO: Add middleware here that checks that the request has sufficient authentication crediential to identify this user as having rights to create a new deployment. Crucially I only want specific Urban Observatory team members being able to create a new deployment.
router.post('/deployments', asyncWrapper(async (req, res): Promise<any> => {
  const createdDeployment = await createDeployment(req.body);
  return res.json(createdDeployment);
}));

