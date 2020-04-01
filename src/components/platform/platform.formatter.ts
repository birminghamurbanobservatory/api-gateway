import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';


export function formatPlatformForClient(platform: object): object {
  const forClient = cloneDeep(platform);
  delete forClient.users;
  delete forClient.createdBy;
  // Initially I was tempted to have isHostedBy be an array containing the full path of ancestor platform. The issue with this is that it's then confusing for clients who want to rehost/unhost a platform as they should be POSTing us a string value, rather than an array, for the new host.
  // Therefore I'm going to use a ancestorPlatform array instead. 
  // TODO I'll need to define ancestorPlatform in a bhamUrbanObs vocabulary somewhere.
  if (forClient.hostedByPath) {
    forClient.ancestorPlatform = forClient.hostedByPath;
  }
  delete forClient.hostedByPath;
  const ordered: any = orderObjectKeys(forClient, ['id', 'name', 'description', 'static', 'ownerDeployment', 'inDeployments', 'isHostedBy', 'ancestorPlatforms', 'location']);
  if (ordered.location) {
    ordered.location = orderObjectKeys(ordered.location, ['id', 'geometry', 'validAt']);
    if (ordered.location.geometry) {
      ordered.location.geometry = orderObjectKeys(ordered.location.geometry, ['type', 'coordinates']);
    }
  }
  return ordered;
}


export function formatPlatformAsLinkedData(platform: any): object {
  const platformLinked = cloneDeep(platform);
  platformLinked['@id'] = platformLinked.id;
  delete platformLinked.id;
  platformLinked['@type'] = 'Platform';
  const ordered = orderObjectKeys(platformLinked, ['@id', '@type', 'name', 'description', 'static', 'ownerDeployment', 'inDeployments', 'isHostedBy', 'ancestorPlatforms', 'location']);
  return ordered;
}


export function addContextToPlatform(platform: any): object {

  const platformWithContext = formatPlatformAsLinkedData(platform);

  platformWithContext['@context'] = [
    contextLinks.platform
  ];

  const ordered = orderObjectKeys(platformWithContext, ['@context', '@id', '@type', 'name', 'description', 'static', 'ownerDeployment', 'inDeployments', 'isHostedBy', 'ancestorPlatforms', 'location']);
  return ordered;

}



export function addContextToPlatforms(platforms: any[]): object {

  const platformsLd = platforms.map(formatPlatformAsLinkedData);

  const platformsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.platform
    ],
    '@id': `${config.api.base}/platforms`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: platformsLd,
  };

  return platformsWithContext;

}