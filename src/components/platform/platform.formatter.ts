import {cloneDeep, pick} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {formatIndividualSensor} from '../sensor/sensor.formatter';
import {renameProperties} from '../../utils/rename';


const keyOrder = ['@context', '@id', '@type', 'label', 'description', 'static', 'inDeployment', 'isHostedBy', 'ancestorPlatforms', 'topPlatform', 'createdUsingRegistrationKey', 'location', 'centroid', 'createdAt', 'updatedAt'];


export function formatIndividualPlatform(platform: any): any {
  const platformLinked = cloneDeep(platform);
  platformLinked['@type'] = 'Platform';
  // I don't really want standard users know which permanent host a platform was generated from, but it is useful for them to know if a platform was generated using a registration key.
  platformLinked.createdUsingRegistrationKey = Boolean(platformLinked.initialisedFrom);
  delete platformLinked.initialisedFrom;
  // There's some restructuring of the location objects required
  if (platformLinked.location) {
    platformLinked.location.type = 'Feature';
    platformLinked.location.properties = {
      validAt: platformLinked.location.validAt
    };
    if (platformLinked.location.height) {
      platformLinked.location.properties.height = platformLinked.location.height;
    }
    delete platformLinked.location.height;
    delete platformLinked.location.validAt;
    platformLinked.location = orderObjectKeys(platformLinked.location, ['id', 'type', 'geometry', 'properties']);
    platformLinked.location.geometry = orderObjectKeys(platformLinked.location.geometry, ['type', 'coordinates']);
  }
  const renamed = renameProperties(platformLinked, {
    id: '@id',
    hostedByPath: 'ancestorPlatforms'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}


export function formatIndividualPlatformCondensed(platform: any): any {
  const linked = formatIndividualPlatform(platform);
  // Pull out the properties we don't need
  const propsToKeep = ['@id', '@type', 'label', 'description', 'static'];
  const condensed = pick(linked, propsToKeep);
  return condensed;
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


export function formatForClientAndAddContextToNestedPlatforms(platforms, extraInfo): any {

  const platformsLd = platforms.map((platform): any => {
    return recursivelyFormatPlatformWithHostsArray(platform);
  });

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

