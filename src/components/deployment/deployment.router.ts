//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get
//-------------------------------------------------
router.get('/deployments', asyncWrapper(async (req, res) => {
  const deployments = await getDeployments();
  return res.json(deployments);
}));