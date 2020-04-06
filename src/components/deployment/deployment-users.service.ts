import * as event from 'event-stream';
import * as check from 'check-types';
import {Forbidden} from '../../errors/Forbidden';


export async function getDeploymentUsers(deploymentId): Promise<any> {
  
}


export async function getDeploymentUser(deploymentId: string, userId: string): Promise<any> {

  const message: any = {
    where: {
      deploymentId,
      userId
    }
  };

  const deploymentUser = await event.publishExpectingResponse('deployment-user.get.request', message);
  return deploymentUser;
}



export async function getLevelsForDeployments(deploymentIds: string[], userId?: string): Promise<{deploymentId: string; level: string}[]> {
  
  const message: any = {
    where: {
      deploymentIds,
    }
  };

  if (userId) {
    message.where.userId = userId;
  }

  // e.g. returns something like:
  // [
  //   {deploymentId: 'deployment-1', level: 'basic'},   will also return 'basic' for public deployments
  //   {deploymentId: 'deployment-2', level: 'admin'},
  //   {deploymentId: 'deployment-3'},                   i.e. when the user has no rights to this deployment
  // ]
  const deploymentLevels = await event.publishExpectingResponse('deployment-user.get-levels-for-deployments.request', message);

  return deploymentLevels;

}


// N.B. in reality this will probably be done through invites instead.
export async function addDeploymentUser(deploymentId: string, userId: string): Promise<void> {
  await event.publishExpectingResponse('deployment-user.create.request', {
    deploymentId,
    userId
  });
}


export async function updateDeploymentUser(deploymentId: string, userId: string, updates: {level: string}): Promise<any> {

  // TODO: Update deployment user - i.e. change a user's rights 

  return;

}


export async function deleteDeploymentUser(deploymentId: string, userId: string): Promise<void> {

  await event.publishExpectingResponse('deployment-user.delete.request');

}