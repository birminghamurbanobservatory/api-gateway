import * as event from 'event-stream';


export async function createDeploymentInvite(deploymentInvite): Promise<any> {
  const createdDeploymentInvite = await event.publishExpectingResponse('deployment-invite.create.request',  {
    new: deploymentInvite
  });
  return createdDeploymentInvite;
}


export async function getDeploymentInvite(id: string): Promise<any> {
  const deploymentInvite = await event.publishExpectingResponse('deployment-invite.get.request', {
    where: {
      id
    }
  });
  return deploymentInvite;
}


export async function acceptDeploymentInvite(inviteId: string, userId: string): Promise<any> {
  const updatedDeployment = await event.publishExpectingResponse('deployment-invite.accept.request', {
    inviteId,
    userId
  });
  return updatedDeployment;
}

