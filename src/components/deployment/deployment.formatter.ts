import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';

const keyOrder = ['@context', '@id', '@type', 'label', 'description', 'public'];


export function formatIndividualDeployment(deployment: any): object {
  const deploymentLinked = cloneDeep(deployment);
  deploymentLinked['@id'] = deploymentLinked.id;
  delete deploymentLinked.id;
  deploymentLinked['@type'] = 'Deployment';
  delete deploymentLinked.users;
  delete deploymentLinked.createdBy;
  const ordered = orderObjectKeys(deploymentLinked, keyOrder);
  return ordered;
}


export function formatIndividualDeploymentCondensed(deployment: any): object {
  const linked = formatIndividualDeployment(deployment);
  // Pull out the properties we don't need
  const removableProps = ['createdAt', 'updatedAt'];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createDeploymentResponse(deployment: any): object {

  const deploymentWithContext = formatIndividualDeployment(deployment);
  
  deploymentWithContext['@context'] = [
    contextLinks.deployment
  ];

  const ordered = orderObjectKeys(deploymentWithContext, keyOrder);
  return ordered;

}


export function createDeploymentsResponse(deployments: any[], extraInfo: {count: number; total: number}): object {

  const deploymentsLd = deployments.map(formatIndividualDeployment);

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
    meta: extraInfo
  };

  return deploymentsWithContext;

}