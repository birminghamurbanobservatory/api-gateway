import {uniq, concat, cloneDeep, intersection} from 'lodash';


export function recursivelyExtractInDeploymentIds(platform): string[] {

  let inDeploymentIds = [platform.inDeployment];
  if (platform.hosts) {
    platform.hosts.forEach((hostee): void => {
      if (hostee.type === 'platform') {
        const hosteeDeploymentIds = recursivelyExtractInDeploymentIds(hostee);
        inDeploymentIds = concat(inDeploymentIds, hosteeDeploymentIds);
      }
    });
  }

  return uniq(inDeploymentIds);

}


export function recursivelyRemoveProtectedHostedPlatforms(platform, safeDeploymentIds: string[]): any {

  const safePlatform = cloneDeep(platform);

  if (safePlatform.hosts) {
    safePlatform.hosts = platform.hosts.filter((hostee): boolean => {
      if (hostee.type === 'platform') {
        const intersectingDeploymentIds = intersection(safeDeploymentIds, [hostee.inDeployment]);
        return intersectingDeploymentIds.length > 0;
      } else {
        return true;
      }
    }).map((hostee): any => {
      if (hostee.type === 'platform') {
        // Recursive part
        return recursivelyRemoveProtectedHostedPlatforms(hostee, safeDeploymentIds);
      } else {
        return hostee;
      }
    });
  }

  return safePlatform;

}