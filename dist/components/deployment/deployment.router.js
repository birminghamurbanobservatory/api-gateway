"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//-------------------------------------------------
// Dependencies
//-------------------------------------------------
const express_1 = __importDefault(require("express"));
const deployment_controller_1 = require("./deployment.controller");
const async_wrapper_1 = require("../../utils/async-wrapper");
const router = express_1.default.Router();
exports.DeploymentRouter = router;
//-------------------------------------------------
// Get all
//-------------------------------------------------
router.get('/deployments', async_wrapper_1.asyncWrapper(async (req, res) => {
    const deployments = await deployment_controller_1.getDeployments();
    return res.json(deployments);
}));
//-------------------------------------------------
// Specific Deployment Request
//-------------------------------------------------
// Whenever a request comes in for a specific deployment we need to check that the user has rights to this deployment first.
// N.B. a trade off is made: we accept that making an extra event-stream request here will add to the total response time, however the the benefit is it saves us having to add the userId to any later event stream request which in turn would add extra logic to handlers of these events. 
router.use('/deployments/:deploymentId', async_wrapper_1.asyncWrapper(async (req, res, next) => {
    const deploymentId = req.params.deploymentId;
    let right;
    if (req.user && req.userId) {
        right = await deployment_controller_1.checkRightsToDeployment(deploymentId, req.user.id);
    }
    else {
        right = await deployment_controller_1.checkRightsToDeployment(deploymentId);
    }
    req.right = right;
    next();
}));
//-------------------------------------------------
// Get single
//-------------------------------------------------
router.get('/deployments/:deploymentId', async_wrapper_1.asyncWrapper(async (req, res) => {
    const deploymentId = req.params.deploymentId;
    const deployments = await deployment_controller_1.getDeployment(deploymentId);
    return res.json(deployments);
}));
//-------------------------------------------------
// Create Deployment
//-------------------------------------------------
// TODO: Add middleware here that checks that the request has sufficient authentication crediential to identify this user as having rights to create a new deployment. Crucially I only want specific Urban Observatory team members being able to create a new deployment.
router.post('/deployments', async_wrapper_1.asyncWrapper(async (req, res) => {
    const createdDeployment = await deployment_controller_1.createDeployment(req.body);
    return res.json(createdDeployment);
}));
//# sourceMappingURL=deployment.router.js.map