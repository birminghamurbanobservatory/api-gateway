//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments, getDeployment} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get all
//-------------------------------------------------
router.get('/deployments', asyncWrapper(async (req, res) => {
  const deployments = await getDeployments();
  return res.json(deployments);
}));


//-------------------------------------------------
// Get single
//-------------------------------------------------
router.get('/deployments/:deploymentId', asyncWrapper(async (req, res) => {
  const deploymentId = req.params.deploymentId;
  const deployments = await getDeployment(deploymentId);
  return res.json(deployments);
}));
