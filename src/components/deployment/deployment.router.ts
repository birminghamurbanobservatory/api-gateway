//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments, getDeployment, createDeployment, deleteDeployment, updateDeployment, formatDeploymentForClient} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {Unauthorized} from '../../errors/Unauthorized';
import * as check from 'check-types';
import {permissionsCheck} from '../../routes/middleware/permissions';
import {Forbidden} from '../../errors/Forbidden';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {InvalidDeployment} from './errors/InvalidDeployment';
import {InvalidDeploymentUpdates} from './errors/InvalidDeploymentUpdates';
import * as logger from 'node-logger';
import {deploymentLevelCheck} from '../../routes/middleware/deployment-level';

const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get multiple deployments
//-------------------------------------------------
const getDeploymentsQuerySchema = joi.object({
  public: joi.boolean(), // lets the user filter their own deployments, returning either public OR private.
  includeAllPublic: joi.boolean() // Returns all public deployments as well as the user's own.
});

router.get('/deployments', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getDeploymentsQuerySchema.validate(req.query);
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
  const deploymentsForClient = deployments.map(formatDeploymentForClient);
  return res.json(deploymentsForClient);

}));


//-------------------------------------------------
// All Specific Deployment Requests
//-------------------------------------------------
// Whenever a request comes in for a specific deployment we need to check that the user has rights to this deployment first.
// N.B. a trade off is made: we accept that making an extra event-stream request here will add to the total response time, however the the benefit is it saves us having to add the userId to any later event stream request which in turn would add extra logic to handlers of these events.
router.use('/deployments/:deploymentId', asyncWrapper(async (req, res, next): Promise<any> => {

  // Get the deployment
  const deploymentId = req.params.deploymentId;
  const deployment = await getDeployment(deploymentId);
  // Add it to the req object so we can use it in later routes.
  req.deployment = deployment;

  let userHasSpecificRights;
  const deploymentIsPublic = deployment.public;

  if (req.user.id) {
    const matchingUser = req.deployment.users.find((user): any => user.id === req.user.id);
    if (matchingUser) {
      userHasSpecificRights = true;
      req.user.deploymentLevel = matchingUser.level;
    } 
  }

  if (!userHasSpecificRights) {
    if (deploymentIsPublic) {
      req.user.deploymentLevel = 'basic';
    } else {
      throw new Forbidden('You are not a user of this private deployment');
    }
  }

  logger.debug(`User ${req.user.id ? `'${req.user.id}'` : '(unauthenticated)'} has '${req.user.deploymentLevel}' rights to deployment '${deploymentId}'`);

  next();

}));


//-------------------------------------------------
// Get deployment
//-------------------------------------------------
router.get('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {
  // We already have the deployment. We just need to remove any parts that we don't want the user seeing
  const deploymentforClient = formatDeploymentForClient(req.deployment);
  return res.json(deploymentforClient);
}));


//-------------------------------------------------
// Create Deployment
//-------------------------------------------------
const createDeploymentsBodySchema = joi.object({
  id: joi.string(),
  name: joi.string()
    .required(),
  description: joi.string(),
  public: joi.boolean()
})
.required();

router.post('/deployments', permissionsCheck('create:deployment'), asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Deployment can not be created because your request has not provided any user credentials');
  }

  const {error: queryErr, value: body} = createDeploymentsBodySchema.validate(req.body);
  if (queryErr) throw new InvalidDeployment(queryErr.message);

  body.createdBy = req.user.id;

  const createdDeployment = await createDeployment(body, req.user.id);
  const deploymentforClient = formatDeploymentForClient(createdDeployment);
  return res.status(201).json(deploymentforClient);

}));


//-------------------------------------------------
// Update Deployment
//-------------------------------------------------
const updateDeploymentsBodySchema = joi.object({
  name: joi.string(),
  description: joi.string(),
  public: joi.boolean()
})
.min(1)
.required();

router.patch('/deployments/:deploymentId', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updateDeploymentsBodySchema.validate(req.body);
  if (queryErr) throw new InvalidDeploymentUpdates(queryErr.message);

  const deploymentId = req.params.deploymentId;
  const updatedDeployment = await updateDeployment(deploymentId, body);
  const deploymentforClient = formatDeploymentForClient(updatedDeployment);
  return res.json(deploymentforClient);

}));



//-------------------------------------------------
// Delete Deployment
//-------------------------------------------------
router.delete('/deployments/:deploymentId', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  await deleteDeployment(deploymentId);
  return res.status(204).send();

}));

