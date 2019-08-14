import * as event from 'event-stream';
import * as check from 'check-types';
import {Forbidden} from '../../errors/Forbidden';


export async function getDeployments(where?: {user?: string; public?: string}, options?: {includeAllPublic?: string}): Promise<any> {

  const deployments = await event.publishExpectingResponse('deployments.get.request', {where, options});
  return deployments;

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
    new: deployment,
    where: {
      user: userId
    }
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
      // TODO: could have an even more specific custom error here?
      throw new Forbidden(`You do not have rights to the ${deploymentId} deployment`);
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