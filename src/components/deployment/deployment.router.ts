//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments, getDeployment, createDeployment, checkRightsToDeployment, deleteDeployment} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {Unauthorized} from '../../errors/Unauthorized';
import * as check from 'check-types';
import {doesUserHavePermission} from '../../utils/permissions';
import {Forbidden} from '../../errors/Forbidden';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';

const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get all
//-------------------------------------------------
const getDeploymentsQuerySchema = joi.object({
  public: joi.boolean(), // let's the user filter their own deployments, returning either public OR private.
  includeAllPublic: joi.boolean() // Returns all public deployments as well as the user's own.
});

router.get('/deployments', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = joi.validate(req.query, getDeploymentsQuerySchema);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  if (check.not.assigned(query.includeAllPublic)) {
    // If authentication is given then by default show them just their own deployments.
    // If they haven't authenticated then show all public deployments by default.
    query.includeAllPublic = check.not.assigned(req.user.id);
  }

  const where: any = {};
  if (req.user.id) where.user = req.user.id;
  if (query.public) where.public = true;

  const deployments = await getDeployments(where, {includeAllPublic: query.includeAllPublic});
  return res.json(deployments);

}));


//-------------------------------------------------
// Specific Deployment Requests
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

  req.deploymentRightLevel = right.level;

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

  if (!req.user.id) {
    throw new Unauthorized('Deployment can not be created because your request has not provided any user credentials');
  }

  // Does this user have permission to do this
  const permission = 'create:deployment';
  const hasPermission = await doesUserHavePermission(req.user.id, permission);
  if (!hasPermission) {
    throw new Forbidden(`You do not have permission (${permission}) to make this request.`);
  }

  const createdDeployment = await createDeployment(req.body, req.user.id);
  return res.status(201).json(createdDeployment);

}));


//-------------------------------------------------
// Update Deployment
//-------------------------------------------------
// TODO: Only allow them to update certain things.


//-------------------------------------------------
// Delete Deployment
//-------------------------------------------------
router.delete('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {

  if (req.deploymentRightLevel !== 'admin') {
    throw new InsufficientDeploymentRights(`To delete a deployment you must have 'admin' level rights to it.`);
  }

  const deploymentId = req.params.deploymentId;
  await deleteDeployment(deploymentId);
  return res.status(204).send();

}));

