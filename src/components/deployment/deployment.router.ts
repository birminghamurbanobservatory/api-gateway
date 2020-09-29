//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getDeployments, getDeployment, createDeployment, deleteDeployment, updateDeployment} from './deployment.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import * as check from 'check-types';
import {InvalidDeploymentUpdates} from './errors/InvalidDeploymentUpdates';
import * as logger from 'node-logger';
import {pick, omit} from 'lodash';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {config} from '../../config';
import {addMetaLinks} from '../common/add-meta-links';
import {stringArrayConditional} from '../../utils/custom-joi-validations';

const router = express.Router();

export {router as DeploymentRouter};


//-------------------------------------------------
// Get deployments
//-------------------------------------------------
const getDeploymentsQuerySchema = joi.object({
  public: joi.boolean(), // lets the user filter their own deployments, returning either public OR private.
  id__begins: joi.string(),
  id__in: joi.string().custom(stringArrayConditional),
  // options
  mineOnly: joi.boolean(), // If false then it gets the user's deployments AND public deployments too.
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc'),
  search: joi.string()
});

router.get('/deployments', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getDeploymentsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'sortBy', 'sortOrder', 'mineOnly'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);

  if (!req.user.id && check.assigned(where.public)) {
    throw new InvalidQueryString(`Please provide user credentials before using the 'public' query string parameter.`);
  }

  if (!req.user.id && check.assigned(options.mineOnly)) {
    throw new InvalidQueryString(`Please provide user credentials before using the 'mineOnly' query string parameter.`);
  }

  let jsonResponse = await getDeployments(where, options, req.user);
  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/deployments`, query);
  validateAgainstSchema(jsonResponse, 'deployments-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get deployment
//-------------------------------------------------
router.get('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const jsonResponse = await getDeployment(deploymentId, req.user);
  validateAgainstSchema(jsonResponse, 'deployment-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Create Deployment
//-------------------------------------------------
router.post('/deployments', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'deployment-create-request-body');
  const jsonResponse = await createDeployment(body, req.user);
  validateAgainstSchema(jsonResponse, 'deployment-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Update Deployment
//-------------------------------------------------
const updateDeploymentBodySchema = joi.object({
  label: joi.string(),
  description: joi.string().allow(''),
  public: joi.boolean()
})
.min(1)
.required();

router.patch('/deployments/:deploymentId', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const body = validateAgainstSchema(req.body, 'deployment-update-request-body');
  
  const jsonResponse = await updateDeployment(deploymentId, body, req.user);
  validateAgainstSchema(jsonResponse, 'deployment-get-response-body');
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

