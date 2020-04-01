import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';


export function formatDeploymentForClient(deployment: object): object {
  const forClient = cloneDeep(deployment);
  delete forClient.users;
  delete forClient.createdBy;
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'public']);
  return ordered;
}


export function formatDeploymentAsLinkedData(deployment: any): object {
  const deploymentLinked = cloneDeep(deployment);
  deploymentLinked['@id'] = deploymentLinked.id;
  delete deploymentLinked.id;
  deploymentLinked['@type'] = 'Deployment';
  return deploymentLinked;
}


export function addContextToDeployment(deployment: any): object {

  const deploymentWithContext = formatDeploymentAsLinkedData(deployment);
  
  deploymentWithContext['@context'] = [
    contextLinks.deployment
  ];

  const ordered = orderObjectKeys(deploymentWithContext, ['@context', '@id', '@type', 'name', 'description', 'public']);
  return ordered;

}


export function addContextToDeployments(deployments: any[]): object {

  const deploymentsLd = deployments.map(formatDeploymentAsLinkedData);

  const deploymentsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.deployment
    ],
    '@id': `${config.api.base}/deployments`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: deploymentsLd,
  };

  return deploymentsWithContext;

}