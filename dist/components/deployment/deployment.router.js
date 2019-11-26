"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//-------------------------------------------------
// Dependencies
//-------------------------------------------------
const express_1 = __importDefault(require("express"));
const deployment_controller_1 = require("./deployment.controller");
const async_wrapper_1 = require("../../utils/async-wrapper");
const joi = __importStar(require("@hapi/joi"));
const InvalidQueryString_1 = require("../../errors/InvalidQueryString");
const Unauthorized_1 = require("../../errors/Unauthorized");
const check = __importStar(require("check-types"));
const permissions_1 = require("../../utils/permissions");
const Forbidden_1 = require("../../errors/Forbidden");
const InsufficientDeploymentRights_1 = require("../../errors/InsufficientDeploymentRights");
const InvalidDeployment_1 = require("./errors/InvalidDeployment");
const InvalidDeploymentUpdates_1 = require("./errors/InvalidDeploymentUpdates");
const logger = __importStar(require("node-logger"));
const router = express_1.default.Router();
exports.DeploymentRouter = router;
//-------------------------------------------------
// Get multiple deployments
//-------------------------------------------------
const getDeploymentsQuerySchema = joi.object({
    public: joi.boolean(),
    includeAllPublic: joi.boolean() // Returns all public deployments as well as the user's own.
});
router.get('/deployments', async_wrapper_1.asyncWrapper(async (req, res) => {
    const { error: queryErr, value: query } = getDeploymentsQuerySchema.validate(req.query);
    if (queryErr)
        throw new InvalidQueryString_1.InvalidQueryString(queryErr.message);
    if (check.not.assigned(query.includeAllPublic)) {
        // If authentication is given then by default show them just their own deployments.
        // If they haven't authenticated then show all public deployments by default.
        query.includeAllPublic = check.not.assigned(req.user.id);
    }
    const where = {};
    if (req.user.id)
        where.user = req.user.id;
    if (query.public)
        where.public = true;
    const deployments = await deployment_controller_1.getDeployments(where, { includeAllPublic: query.includeAllPublic });
    const deploymentsForClient = deployments.map(deployment_controller_1.formatDeploymentForClient);
    return res.json(deploymentsForClient);
}));
//-------------------------------------------------
// All Specific Deployment Requests
//-------------------------------------------------
// Whenever a request comes in for a specific deployment we need to check that the user has rights to this deployment first.
// N.B. a trade off is made: we accept that making an extra event-stream request here will add to the total response time, however the the benefit is it saves us having to add the userId to any later event stream request which in turn would add extra logic to handlers of these events.
router.use('/deployments/:deploymentId', async_wrapper_1.asyncWrapper(async (req, res, next) => {
    // Get the deployment
    const deploymentId = req.params.deploymentId;
    const deployment = await deployment_controller_1.getDeployment(deploymentId);
    // Add it to the req object so we can use it in later routes.
    req.deployment = deployment;
    let userHasSpecificRights;
    const deploymentIsPublic = deployment.public;
    if (req.user.id) {
        const matchingUser = req.deployment.users.find((user) => user.id === req.user.id);
        if (matchingUser) {
            userHasSpecificRights = true;
            req.user.deploymentLevel = matchingUser.level;
        }
    }
    if (!userHasSpecificRights) {
        if (deploymentIsPublic) {
            req.user.deploymentLevel = 'basic';
        }
        else {
            throw new Forbidden_1.Forbidden('You are not a user of this private deployment');
        }
    }
    logger.debug(`User ${req.user.id ? `'${req.user.id}'` : '(unauthenticated)'} has '${req.user.deploymentLevel}' rights to deployment '${deploymentId}'`);
    next();
}));
//-------------------------------------------------
// Get deployment
//-------------------------------------------------
router.get('/deployments/:deploymentId', async_wrapper_1.asyncWrapper(async (req, res) => {
    // We already have the deployment. We just need to remove any parts that we don't want the user seeing
    const deploymentforClient = deployment_controller_1.formatDeploymentForClient(req.deployment);
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
router.post('/deployments', async_wrapper_1.asyncWrapper(async (req, res) => {
    if (!req.user.id) {
        throw new Unauthorized_1.Unauthorized('Deployment can not be created because your request has not provided any user credentials');
    }
    // Does this user have permission to do this
    const permission = 'create:deployment';
    const hasPermission = await permissions_1.doesUserHavePermission(req.user.id, permission);
    if (!hasPermission) {
        throw new Forbidden_1.Forbidden(`You do not have permission (${permission}) to make this request.`);
    }
    const { error: queryErr, value: body } = createDeploymentsBodySchema.validate(req.body);
    if (queryErr)
        throw new InvalidDeployment_1.InvalidDeployment(queryErr.message);
    body.createdBy = req.user.id;
    const createdDeployment = await deployment_controller_1.createDeployment(body, req.user.id);
    const deploymentforClient = deployment_controller_1.formatDeploymentForClient(createdDeployment);
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
router.patch('/deployments/:deploymentId', async_wrapper_1.asyncWrapper(async (req, res) => {
    if (req.user.deploymentLevel !== 'admin') {
        throw new InsufficientDeploymentRights_1.InsufficientDeploymentRights(`To update a deployment you must have 'admin' level rights to it.`);
    }
    const { error: queryErr, value: body } = updateDeploymentsBodySchema.validate(req.body);
    if (queryErr)
        throw new InvalidDeploymentUpdates_1.InvalidDeploymentUpdates(queryErr.message);
    const deploymentId = req.params.deploymentId;
    const updatedDeployment = await deployment_controller_1.updateDeployment(deploymentId, body);
    const deploymentforClient = deployment_controller_1.formatDeploymentForClient(updatedDeployment);
    return res.json(deploymentforClient);
}));
//-------------------------------------------------
// Delete Deployment
//-------------------------------------------------
router.delete('/deployments/:deploymentId', async_wrapper_1.asyncWrapper(async (req, res) => {
    if (req.user.deploymentLevel !== 'admin') {
        throw new InsufficientDeploymentRights_1.InsufficientDeploymentRights(`To delete a deployment you must have 'admin' level rights to it.`);
    }
    const deploymentId = req.params.deploymentId;
    await deployment_controller_1.deleteDeployment(deploymentId);
    return res.status(204).send();
}));
//# sourceMappingURL=deployment.router.js.map