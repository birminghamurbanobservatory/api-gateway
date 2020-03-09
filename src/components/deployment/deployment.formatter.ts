import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';

export function formatDeploymentForClient(deployment: object): object {
  const forClient = cloneDeep(deployment);
  delete forClient.users;
  delete forClient.createdBy;
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'public']);
  return ordered;
}