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
import {InvalidDeployment} from './errors/InvalidDeployment';
import {InvalidDeploymentUpdates} from './errors/InvalidDeploymentUpdates';
import * as logger from 'node-logger';
import {deploymentLevelCheck} from '../../routes/middleware/deployment-level';
import {concat, uniqBy, pick} from 'lodash';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';

const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get multiple deployments
//-------------------------------------------------
const getDeploymentsQuerySchema = joi.object({
  public: joi.boolean(), // lets the user filter their own deployments, returning either public OR private.
  includeAllPublic: joi.boolean(), // Returns all public deployments as well as the user's own.
  id__begins: joi.string()
});

router.get('/deployments', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getDeploymentsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  const whereKeys = ['id__begins', 'public'];
  const whereBase = convertQueryToWhere(pick(query, whereKeys));

  const hasSuperRights = req.user.permissions && req.user.permissions.includes('get:deployments');

  let deployments;

  //------------------------
  // Superuser
  //------------------------
  if (hasSuperRights) {
    deployments = await getDeployments(whereBase);
  }

  //------------------------
  // User with credentials
  //------------------------
  if (req.user.id) {

    const usersWhere = Object.assign({}, whereBase, {user: req.user.id});
    const usersDeployments = await getDeployments(usersWhere);

    let allPublicDeployments = [];
    if (query.includeAllPublic === true) {
      allPublicDeployments = await getDeployments({public: true});
    }

    const combindedDeployments = concat(usersDeployments, allPublicDeployments);
    const uniqueDeployments = uniqBy(combindedDeployments, 'id');

    deployments = uniqueDeployments;

  }

  //------------------------
  // User without credentials
  //------------------------
  if (!req.user.id) {
    if (check.assigned(query.public)) {
      throw new InvalidQueryString(`Please provide user credentials before using the 'public' query string parameter.`);
    }
    if (check.assigned(query.includeAllPublic)) {
      throw new InvalidQueryString(`Please provide user credentials before using the 'includeAllPublic' query string parameter.`);
    }
    const noCredentialsWhere = Object.assign({}, whereBase, {public: true});
    deployments = await getDeployments(noCredentialsWhere);
  }

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

  const adminToAll = req.user.permissions.includes('admin-all:deployments');
  // TODO: you may eventually wish to create basic-all:deployments, or engineer-all:deployments permissions, however you'd need to make sure that if the user already has specific rights to this deployment and they are higher than the generic permission, that it uses the more specific one.
  
  if (adminToAll) {
    req.user.deploymentLevel = 'admin';

  } else {
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
const updateDeploymentBodySchema = joi.object({
  name: joi.string(),
  description: joi.string(),
  public: joi.boolean()
})
.min(1)
.required();

router.patch('/deployments/:deploymentId', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updateDeploymentBodySchema.validate(req.body);
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

