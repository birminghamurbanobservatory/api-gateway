"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const event = __importStar(require("event-stream"));
const check = __importStar(require("check-types"));
const Forbidden_1 = require("../../errors/Forbidden");
// TODO: might end up adding an options argument in here, e.g. to include the userId, or to filter by public deployments only
async function getDeployments() {
    const deployments = await event.publishExpectingResponse('deployments.get.request');
    return deployments;
}
exports.getDeployments = getDeployments;
async function getDeployment(deploymentId) {
    const deployment = await event.publishExpectingResponse('deployment.get.request', { id: deploymentId });
    return deployment;
}
exports.getDeployment = getDeployment;
async function createDeployment(deployment) {
    const createdDeployment = await event.publishExpectingResponse('deployment.create.request', deployment);
    return createdDeployment;
}
exports.createDeployment = createDeployment;
async function checkRightsToDeployment(deploymentId, userId) {
    let right;
    const message = {
        deployment: deploymentId
    };
    if (check.nonEmptyString(userId)) {
        message.userId = userId;
    }
    try {
        right = await event.publishExpectingResponse('right.get.request', message);
    }
    catch (err) {
        if (err.name === 'RightNotFound') {
            // TODO: could have an even more specific custom error here?
            throw new Forbidden_1.Forbidden(`You do not have rights to the ${deploymentId} deployment`);
        }
        else {
            throw err;
        }
    }
    return right;
}
exports.checkRightsToDeployment = checkRightsToDeployment;
//# sourceMappingURL=deployment.controller.js.map