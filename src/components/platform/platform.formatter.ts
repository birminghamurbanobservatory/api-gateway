import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {formatIndividualSensor} from '../sensor/sensor.formatter';


const keyOrder = ['@context', '@id', '@type', 'name', 'description', 'static', 'ownerDeployment', 'inDeployments', 'isHostedBy', 'ancestorPlatforms', 'location'];


export function formatIndividualPlatform(platform: any): any {
  const platformLinked = cloneDeep(platform);
  platformLinked['@id'] = platformLinked.id;
  delete platformLinked.id;
  platformLinked['@type'] = 'Platform';
  delete platformLinked.users;
  delete platformLinked.createdBy;
  if (platformLinked.hostedByPath) {
    platformLinked.ancestorPlatforms = platformLinked.hostedByPath;
  }
  delete platformLinked.hostedByPath;
  const ordered = orderObjectKeys(platformLinked, keyOrder);
  if (ordered.location) {
    ordered.location = orderObjectKeys(ordered.location, ['id', 'geometry', 'validAt']);
    if (ordered.location.geometry) {
      ordered.location.geometry = orderObjectKeys(ordered.location.geometry, ['type', 'coordinates']);
    }
  }
  return ordered;
}


export function createPlatformResponse(platform: any): object {

  const platformWithContext = formatIndividualPlatform(platform);

  platformWithContext['@context'] = [
    contextLinks.platform
  ];

  const ordered = orderObjectKeys(platformWithContext, keyOrder);
  return ordered;

}


export function createPlatformsResponse(platforms: any[], extraInfo: {count: number; total: number}): object {

  const platformsLd = platforms.map(formatIndividualPlatform);

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
    meta: extraInfo
  };

  return platformsWithContext;

}



export function formatForClientAndAddContextToPlatformWithHostsArray(platform): any {

  const platformWithContext = recursivelyFormatPlatformWithHostsArray(platform);

  platformWithContext['@context'] = [
    contextLinks.platform,
    contextLinks.sensor // because there could be sensors in the hosts array
  ];

  const ordered = orderObjectKeys(platformWithContext, keyOrder);
  return ordered;

}


export function recursivelyFormatPlatformWithHostsArray(platform): any {

  const platformLinked = formatIndividualPlatform(platform);
  delete platformLinked.type; // because @type should now be present.

  if (platform.hosts) {
    platformLinked.hosts = platform.hosts.map((hostee): any => {
      if (hostee.type === 'sensor') {
        const sensorLinked = formatIndividualSensor(hostee);
        delete sensorLinked.type; // because @type should now be present.
        return sensorLinked;
      } else if (hostee.type === 'platform') {
        // recursive call
        return recursivelyFormatPlatformWithHostsArray(hostee);
      } else {
        throw new Error('Unknown type in platform hosts array');
      }
    });
  }

  return platformLinked;

}