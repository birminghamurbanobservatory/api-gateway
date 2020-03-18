import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';


export function formatPermanentHostForClient(permanentHost: object): object {
  const forClient = cloneDeep(permanentHost);
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'registrationKey']);
  return ordered;
}


export function formatPermanentHostAsLinkedData(permanentHost: any): object {
  const permanentHostLinked = cloneDeep(permanentHost);
  permanentHostLinked['@id'] = permanentHostLinked.id;
  delete permanentHostLinked.id;
  // TODO: is there anything else I need to add, e.g. links to deployments and host platforms, or a @base for these?
  return permanentHostLinked;
}


export function addContextToPermanentHost(permanentHost: any): object {

  const permanentHostWithContext = formatPermanentHostAsLinkedData(permanentHost);

  permanentHostWithContext['@context'] = [
    contextLinks.permanentHost
  ];

  const ordered = orderObjectKeys(permanentHostWithContext, ['@context', '@id', 'name', 'description', 'registrationKey']);
  return ordered;

}


export function addContextToPermanentHosts(permanentHosts: any[]): object {

  const permanentHostsLd = permanentHosts.map(formatPermanentHostAsLinkedData);

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
  };

  return permanentHostsWithContext;

}