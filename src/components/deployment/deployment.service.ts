import * as event from 'event-stream';
import {WhereItem} from '../common/where-item.class';


export async function getDeployments(where: {user?: string; public?: boolean; id?: WhereItem; search?: string}, options?: any): Promise<{deployments: any[]; count: number; total: number}> {
  const response = await event.publishExpectingResponse('deployments.get.request', {
    where,
    options
  });
  return {
    deployments: response.data,
    count: response.meta.count,
    total: response.meta.total
  };
}


export async function getDeployment(id: string): Promise<any> {
  const deployment = await event.publishExpectingResponse('deployment.get.request', {
    where: {
      id
    }
  });
  return deployment;
}


export async function createDeployment(deployment): Promise<any> {
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



