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
// Get single
//-------------------------------------------------
router.get('/deployments/:deploymentId', async_wrapper_1.asyncWrapper(async (req, res) => {
    const deploymentId = req.params.deploymentId;
    const deployments = await deployment_controller_1.getDeployment(deploymentId);
    return res.json(deployments);
}));
//# sourceMappingURL=deployment.router.js.map