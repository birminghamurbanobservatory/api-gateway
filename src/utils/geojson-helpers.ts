import * as check from 'check-types';

export function centroidToGeometry(centroid: {lat: number; lng: number; height?: number}): {type: string; coordinates: any[]} {

  const geometry = {
    type: 'Point',
    coordinates: [centroid.lng, centroid.lat]
  };

  if (check.assigned(centroid.height)) {
    geometry.coordinates.push(centroid.height);
  }

  return geometry;

}