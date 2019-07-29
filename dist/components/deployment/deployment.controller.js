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
// TODO: might end up adding an options argument in here, e.g. to include the userId, or to filter by public deployments only
async function getDeployments() {
    const deployments = await event.publishExpectingResponse('deployments.get.request');
    return deployments;
}
exports.getDeployments = getDeployments;
async function getDeployment(deploymentId) {
    const deployment = await event.publishExpectingResponse('deployment.get.request', deploymentId);
    return deployment;
}
exports.getDeployment = getDeployment;
//# sourceMappingURL=deployment.controller.js.map