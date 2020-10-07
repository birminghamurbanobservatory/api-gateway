import * as event from 'event-stream';


export async function getDeploymentUsers(where: {deploymentId: string}): Promise<{users: any[]; count: number; total: number}> {
  const response = await event.publishExpectingResponse('deployment-users.get.request', {
    where
  });
  return {
    users: response.data,
    count: response.meta.count,
    total: response.meta.total
  };
}


export async function getDeploymentUser(deploymentId: string, userId: string): Promise<any> {
  const deploymentUser = await event.publishExpectingResponse('deployment-user.get.request', {
    where: {
      deploymentId,
      userId
    }
  });
  return deploymentUser;
}



export async function deleteDeploymentUser(deploymentId: string, userId: string): Promise<void> {
  await event.publishExpectingResponse('deployment-user.delete.request', {
    where: {
      deploymentId,
      userId
    }
  });
  return;
}



