"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const event = __importStar(require("event-stream"));
const check = __importStar(require("check-types"));
const Forbidden_1 = require("../../errors/Forbidden");
const _ = __importStar(require("lodash"));
const order_object_keys_1 = __importDefault(require("../../utils/order-object-keys"));
async function getDeployments(where, options) {
    let usersDeployments = [];
    let allPublicDeployments = [];
    if (where.user) {
        usersDeployments = await event.publishExpectingResponse('deployments.get.request', {
            where
        });
    }
    if ((options && options.includeAllPublic) || !where.user) {
        allPublicDeployments = await event.publishExpectingResponse('deployments.get.request', {
            where: {
                public: true
            }
        });
    }
    const deployments = _.concat(usersDeployments, allPublicDeployments);
    const uniqueDeployments = _.uniqBy(deployments, 'id');
    return uniqueDeployments;
}
exports.getDeployments = getDeployments;
async function getDeployment(deploymentId) {
    const deployment = await event.publishExpectingResponse('deployment.get.request', {
        where: {
            id: deploymentId
        }
    });
    return deployment;
}
exports.getDeployment = getDeployment;
async function createDeployment(deployment, userId) {
    if (userId) {
        deployment.createdBy = userId;
    }
    const createdDeployment = await event.publishExpectingResponse('deployment.create.request', {
        new: deployment
    });
    return createdDeployment;
}
exports.createDeployment = createDeployment;
async function getRightsToDeployment(deploymentId, userId) {
    let right;
    const message = {
        where: {
            deploymentId
        }
    };
    if (check.nonEmptyString(userId)) {
        message.where.user = userId;
    }
    try {
        right = await event.publishExpectingResponse('deployment-user.get.request', message);
    }
    catch (err) {
        if (err.name === 'RightNotFound') {
            throw new Forbidden_1.Forbidden(err.message);
        }
        else {
            throw err;
        }
    }
    return right;
}
exports.getRightsToDeployment = getRightsToDeployment;
// N.B. in reality this will probably be done through invites instead.
async function addRightsToDeployment(deploymentId, userId) {
    await event.publishExpectingResponse('deployment-user.create.request', {
        deploymentId,
        userId
    });
}
exports.addRightsToDeployment = addRightsToDeployment;
async function deleteRightsToDeployment(deploymentId, userId) {
    await event.publishExpectingResponse('deployment-user.delete.request');
}
exports.deleteRightsToDeployment = deleteRightsToDeployment;
async function updateDeployment(deploymentId, updates) {
    const updatedDeployment = await event.publishExpectingResponse('deployment.update.request', {
        where: {
            id: deploymentId
        },
        updates
    });
    return updatedDeployment;
}
exports.updateDeployment = updateDeployment;
async function deleteDeployment(deploymentId) {
    await event.publishExpectingResponse('deployment.delete.request', {
        where: {
            id: deploymentId
        }
    });
    return;
}
exports.deleteDeployment = deleteDeployment;
function formatDeploymentForClient(deployment) {
    const forClient = _.cloneDeep(deployment);
    delete forClient.users;
    delete forClient.createdBy;
    const ordered = order_object_keys_1.default(forClient, ['id', 'name', 'description', 'public']);
    return ordered;
}
exports.formatDeploymentForClient = formatDeploymentForClient;
//# sourceMappingURL=deployment.controller.js.map