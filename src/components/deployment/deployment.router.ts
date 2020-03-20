//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments, getDeployment, createDeployment, deleteDeployment, updateDeployment} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import * as check from 'check-types';
import {InvalidDeployment} from './errors/InvalidDeployment';
import {InvalidDeploymentUpdates} from './errors/InvalidDeploymentUpdates';
import * as logger from 'node-logger';
import {pick} from 'lodash';
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
  const where = convertQueryToWhere(pick(query, whereKeys));

  if (!req.user.id && check.assigned(where.public)) {
    throw new InvalidQueryString(`Please provide user credentials before using the 'public' query string parameter.`);
  }

  const options: any = {};
  if (check.assigned(query.includeAllPublic)) {
    options.includeAllPublic = query.includeAllPublic;
  }

  if (!req.user.id && check.assigned(options.includeAllPublic)) {
    throw new InvalidQueryString(`Please provide user credentials before using the 'includeAllPublic' query string parameter.`);
  }

  const jsonResponse = await getDeployments(where, req.user, options);
  res.set('Content-Type', 'application/ld+json');
  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get deployment
//-------------------------------------------------
router.get('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const jsonResponse = await getDeployment(deploymentId, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse);

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

  const {error: queryErr, value: body} = createDeploymentsBodySchema.validate(req.body);
  if (queryErr) throw new InvalidDeployment(queryErr.message);

  const jsonResponse = await createDeployment(body, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Update Deployment
//-------------------------------------------------
const updateDeploymentBodySchema = joi.object({
  name: joi.string(),
  description: joi.string().allow(''),
  public: joi.boolean()
})
.min(1)
.required();

router.patch('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updateDeploymentBodySchema.validate(req.body);
  if (queryErr) throw new InvalidDeploymentUpdates(queryErr.message);

  const deploymentId = req.params.deploymentId;

  const jsonResponse = await updateDeployment(deploymentId, body, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Delete Deployment
//-------------------------------------------------
router.delete('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  await deleteDeployment(deploymentId, req.user);
  return res.status(204).send();

}));

