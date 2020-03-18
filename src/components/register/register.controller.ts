import {ApiUser} from '../common/api-user.class';
import * as registerService from './register.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {getDeployment} from '../deployment/deployment.service';
import {formatPlatformForClient, addContextToPlatform} from '../platform/platform.formatter';


export async function registerToDeployment(deploymentId: string, registrationKey: string, user: ApiUser): Promise<any> {

  const deployment = getDeployment(deploymentId);

  deploymentLevelCheck(deployment, user, ['admin', 'engineer']);

  const createdPlatform = await registerService.registerToDeployment(deploymentId, registrationKey);
  const platformForClient = formatPlatformForClient(createdPlatform);
  const platformWithContext = addContextToPlatform(platformForClient);
  return platformWithContext;

}