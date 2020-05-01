import {cloneDeep, pick} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {formatIndividualSensor} from '../sensor/sensor.formatter';
import {centroidToGeometry} from '../../utils/geojson-helpers';


const keyOrder = ['@context', '@id', '@type', 'name', 'description', 'static', 'inDeployment', 'isHostedBy', 'ancestorPlatforms', 'location', 'centroid', 'createdAt', 'updatedAt'];


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
  // There's some restructuring of the location objects required
  if (platformLinked.location) {
    const {shape, centroid} = splitLocationIntoCentroidAndShape(platformLinked.location);
    delete platformLinked.location;
    platformLinked.location = shape;
    platformLinked.centroid = centroid;
  }
  const ordered = orderObjectKeys(platformLinked, keyOrder);
  return ordered;
}


export function formatIndividualPlatformCondensed(platform: any): any {
  const linked = formatIndividualSensor(platform);
  // Pull out the properties we don't need
  const propsToKeep = ['@id', '@type', 'name', 'description', 'static'];
  const condensed = pick(linked, propsToKeep);
  return condensed;
}


function splitLocationIntoCentroidAndShape(location: any): {shape: any; centroid: any} {

  const shape = {
    type: 'Feature',
    id: location.id,
    geometry: location.geometry,
    properties: {
      validAt: location.validAt
    }
  };

  const centroid = {
    type: 'Feature',
    id: location.id,
    geometry: centroidToGeometry(location.centroid),
    properties: {
      validAt: location.validAt
    }
  };

  return {
    shape,
    centroid
  };

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

