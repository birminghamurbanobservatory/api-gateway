import {ApiUser} from '../common/api-user.class';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {getDeployment} from '../deployment/deployment.service';



export async function getDeploymentUsers(deploymentId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('admin-all:deployments');

  const deployment = await getDeployment(deploymentId);

  if (!hasSuperUserPermission) {
    deploymentLevelCheck(deployment, user, ['admin', 'social']);
  }

  // TODO: Need to add some @context.
  return deployment.users;

}