import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';

const keyOrder = ['@context', '@id', '@type', 'name', 'description', 'static', 'registrationKey', 'registeredAs', 'createdAt', 'updatedAt'];


export function formatIndividualPermanentHost(permanentHost: any): object {
  const permanentHostLinked = cloneDeep(permanentHost);
  permanentHostLinked['@id'] = permanentHostLinked.id;
  delete permanentHostLinked.id;
  permanentHostLinked['@type'] = 'PermanentHost';
  // TODO: is there anything else I need to add, e.g. links to deployments and host platforms, or a @base for these?
  const ordered = orderObjectKeys(permanentHostLinked, keyOrder);
  return ordered;
}


export function createPermanentHostResponse(permanentHost: any): object {

  const permanentHostWithContext = formatIndividualPermanentHost(permanentHost);

  permanentHostWithContext['@context'] = [
    contextLinks.permanentHost
  ];

  const ordered = orderObjectKeys(permanentHostWithContext, keyOrder);
  return ordered;

}


export function createPermanentHostsResponse(permanentHosts: any[], extraInfo: {count: number; total: number}): object {

  const permanentHostsLd = permanentHosts.map(formatIndividualPermanentHost);

  const permanentHostsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.permanentHost
    ],
    '@id': `${config.api.base}/permanent-hosts`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: permanentHostsLd,
    meta: extraInfo
  };

  return permanentHostsWithContext;

}