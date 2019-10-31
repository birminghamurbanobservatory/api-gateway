//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments, getDeployment, createDeployment, checkRightsToDeployment, deleteDeployment, updateDeployment} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {Unauthorized} from '../../errors/Unauthorized';
import * as check from 'check-types';
import {doesUserHavePermission} from '../../utils/permissions';
import {Forbidden} from '../../errors/Forbidden';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {InvalidDeployment} from './errors/InvalidDeployment';
import {InvalidDeploymentUpdates} from './errors/InvalidDeploymentUpdates';
import * as logger from 'node-logger';

const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get all
//-------------------------------------------------
const getDeploymentsQuerySchema = joi.object({
  public: joi.boolean(), // lets the user filter their own deployments, returning either public OR private.
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
  if (req.user && req.user.id) {
    right = await checkRightsToDeployment(deploymentId, req.user.id);
  } else {
    right = await checkRightsToDeployment(deploymentId);
  }

  req.deploymentRightLevel = right.level;

  logger.debug(`User '${req.user.id}' has '${req.deploymentRightLevel}' rights to deployment '${deploymentId}'`);

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
const createDeploymentsBodySchema = joi.object({
  id: joi.string(),
  name: joi.string()
    .required(),
  description: joi.string(),
  public: joi.boolean()
})
.required();

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

  const {error: queryErr, value: body} = joi.validate(req.body, createDeploymentsBodySchema);
  if (queryErr) throw new InvalidDeployment(queryErr.message);

  body.createdBy = req.user.id;

  const createdDeployment = await createDeployment(body, req.user.id);
  return res.status(201).json(createdDeployment);

}));


//-------------------------------------------------
// Update Deployment
//-------------------------------------------------
const updateDeploymentsBodySchema = joi.object({
  id: joi.string(), // there's actually no real harm in letting them change the id as long as we warn them that urls will change as a result
  name: joi.string(),
  description: joi.string(),
  public: joi.boolean()
})
.min(1)
.required();

router.patch('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {

  if (req.deploymentRightLevel !== 'admin') {
    throw new InsufficientDeploymentRights(`To update a deployment you must have 'admin' level rights to it.`);
  }

  const {error: queryErr, value: body} = joi.validate(req.body, updateDeploymentsBodySchema);
  if (queryErr) throw new InvalidDeploymentUpdates(queryErr.message);

  const deploymentId = req.params.deploymentId;
  const updatedDeployment = await updateDeployment(deploymentId, body);
  return res.json(updatedDeployment);

}));


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

