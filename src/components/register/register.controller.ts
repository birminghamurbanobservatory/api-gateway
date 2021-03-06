import {ApiUser} from '../common/api-user.class';
import * as registerService from './register.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {getDeployment} from '../deployment/deployment.service';
import {createPlatformResponse} from '../platform/platform.formatter';


export async function registerToDeployment(deploymentId: string, registrationKey: string, user: ApiUser): Promise<any> {

  const deployment = await getDeployment(deploymentId);

  deploymentLevelCheck(deployment, user, ['admin', 'engineer']);

  const createdPlatform = await registerService.registerToDeployment(deploymentId, registrationKey);
  const platformWithContext = createPlatformResponse(createdPlatform);
  return platformWithContext;

}