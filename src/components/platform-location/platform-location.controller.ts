import * as event from 'event-stream';




export async function getPlatformLocations(where: {platformId?: string}): Promise<any> {
  const platforms = await event.publishExpectingResponse('platform-locations.get.request', {
    where: {
      // TODO: Add date filters. And perhaps spatial filters.
      platformId: where.platformId
    }
  });
  return platforms;
}




export function formatPlatformLocationsForClient(locations: any[]): object {
  // TODO: if it doesn't cause a significant performance hit.
  return locations;
}