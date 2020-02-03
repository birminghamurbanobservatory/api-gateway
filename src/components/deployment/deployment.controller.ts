import * as event from 'event-stream';
import * as check from 'check-types';
import {Forbidden} from '../../errors/Forbidden';
import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';


export async function getDeployments(where: {user?: string; public?: boolean; id?: object}): Promise<any> {

  const deployments = await event.publishExpectingResponse('deployments.get.request', {
    where
  });

  return deployments;

}


export async function getDeployment(id: string): Promise<any> {
  const deployment = await event.publishExpectingResponse('deployment.get.request', {
    where: {
      id
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



export async function updateDeployment(id: string, updates: any): Promise<any> {
  const updatedDeployment = await event.publishExpectingResponse('deployment.update.request', {
    where: {
      id
    },
    updates
  });
  return updatedDeployment;
}


export async function deleteDeployment(id: string): Promise<void> {
  await event.publishExpectingResponse('deployment.delete.request', {
    where: {
      id
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