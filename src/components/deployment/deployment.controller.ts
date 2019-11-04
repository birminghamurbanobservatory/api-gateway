import * as event from 'event-stream';
import * as check from 'check-types';
import {Forbidden} from '../../errors/Forbidden';
import * as _ from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';


export async function getDeployments(where: {user?: string; public?: string}, options?: {includeAllPublic?: string}): Promise<any> {

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


export async function getDeployment(deploymentId: string): Promise<any> {
  const deployment = await event.publishExpectingResponse('deployment.get.request', {
    where: {
      id: deploymentId
    }
  });
  return deployment;
}


export async function createDeployment(deployment, userId: string): Promise<any> {
  const createdDeployment = await event.publishExpectingResponse('deployment.create.request',  {
    new: deployment
  });
  return createdDeployment;
}


export async function checkRightsToDeployment(deploymentId: string, userId?: string): Promise<any> {

  let right;

  const message: any = {
    where: {
      deployment: deploymentId
    }
  };
  if (check.nonEmptyString(userId)) {
    message.where.user = userId;
  }

  try {
    right = await event.publishExpectingResponse('right.get.request', message);
  } catch (err) {
    if (err.name === 'RightNotFound') {
      throw new Forbidden(err.message);
    } else {
      throw err;
    }
  }

  return right;

}


export async function updateDeployment(deploymentId: string, updates: any): Promise<void> {
  const updatedDeployment = await event.publishExpectingResponse('deployment.update.request', {
    where: {
      id: deploymentId
    },
    updates
  });
  return updatedDeployment;
}


export async function deleteDeployment(deploymentId: string): Promise<void> {
  await event.publishExpectingResponse('deployment.delete.request', {
    where: {
      id: deploymentId
    }
  });
  return;
}



export function formatDeploymentForClient(deployment: object): object {
  const deploymentForClient = _.cloneDeep(deployment);
  delete deploymentForClient.users;
  delete deploymentForClient.createdBy;
  const orderedDeployment = orderObjectKeys(deploymentForClient, ['id', 'name', 'description', 'public']);
  return orderedDeployment;
}