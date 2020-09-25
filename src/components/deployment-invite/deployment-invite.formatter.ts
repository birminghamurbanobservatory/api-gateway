import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'deploymentId', 'deploymentLabel', 'accessLevel', 'expiresAt'];


export function formatIndividualDeploymentInvite(deploymentInvite: any): object {
  const deploymentInviteLinked = cloneDeep(deploymentInvite);
  deploymentInviteLinked['@type'] = 'DeploymentInvite';
  const renamed = renameProperties(deploymentInviteLinked, {
    id: '@id',
    level: 'accessLevel'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}


export function createDeploymentInviteResponse(deploymentInvite: any): object {

  const deploymentInviteWithContext = formatIndividualDeploymentInvite(deploymentInvite);
  
  deploymentInviteWithContext['@context'] = [
    contextLinks.deploymentInvite
  ];

  const ordered = orderObjectKeys(deploymentInviteWithContext, keyOrder);
  return ordered;

}
