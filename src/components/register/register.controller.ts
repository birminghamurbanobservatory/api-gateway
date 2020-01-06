
import * as event from 'event-stream';


export async function registerToDeployment(deploymentId: string, registrationKey: string): Promise<any> {
  const created = await event.publishExpectingResponse('registration.request',  {
    where: {
      deploymentId,
      registrationKey
    }
  });
  return created;
}