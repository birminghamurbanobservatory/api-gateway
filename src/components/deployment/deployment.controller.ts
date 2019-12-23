import * as event from 'event-stream';
import * as check from 'check-types';
import {Forbidden} from '../../errors/Forbidden';
import {cloneDeep, concat, uniqBy} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';


export async function getDeployments(where: {user?: string; public?: boolean}, options?: {includeAllPublic?: boolean}): Promise<any> {

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

  const deployments = concat(usersDeployments, allPublicDeployments);
  const uniqueDeployments = uniqBy(deployments, 'id');

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


export async function createDeployment(deployment, userId?: string): Promise<any> {
   
  if (userId) {
    deployment.createdBy = userId;
  }

  const createdDeployment = await event.publishExpectingResponse('deployment.create.request',  {
    new: deployment
  });

  return createdDeployment;
}



export async function updateDeployment(deploymentId: string, updates: any): Promise<any> {
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
  const forClient = cloneDeep(deployment);
  delete forClient.users;
  delete forClient.createdBy;
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'public']);
  return ordered;
}