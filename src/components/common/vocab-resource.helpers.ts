import {ApiUser} from './api-user.class';
import {getDeployments} from '../deployment/deployment.service';


/**
 * Builds an array that should be added to the 'where' object when requesting vocab resources, e.g. procedures, units, observedProperties, etc. It ensures we only return resources that the user has the rights to access. E.g. all users can get resouces that are 'listed', but authenticated users can also get resources they created, or belong to a deployment they have specific access to. Users with special permissions will have access to even more and thus more items are added to the 'or' array. The where object can still have extra properties to further filter the response, but this 'or' array ensures that it will only filter resources that the user already has the rights to access.
 * @param user 
 */
export async function buildVocabResourceOrArray(user: ApiUser): Promise<any[]> {

  let userType;
  if (user.permissions.includes('crud:vocab-resources')) {
    userType = 'fullAccess';
  } else if (user.permissions.includes('admin-all:deployments')) {
    userType = 'adminAllDeployments';
  } else if (user.id) {
    userType = 'authenticated';
  } else {
    userType = 'unauthenticated';
  }

  // We'll build an 'or' array in the where object depending on the access that the particular user has. Some of these 'or' objects may be overwritten anyway by other parameters in the where object.
  const orArray = [];
  if (userType === 'fullAccesss') {
    // Don't need an orArray as they can access everything anyway.
  }
  if (['adminAllDeployments', 'authenticated', 'unauthenticated'].includes(userType)) {
    orArray.push({listed: true});
  }
  if (['adminAllDeployments', 'authenticated'].includes(userType)) {
    orArray.push({createdBy: user.id});
  }
  if (['adminAllDeployments'].includes(userType)) {
    orArray.push({belongsToDeployment: {exists: true}});
  }
  
  if (userType === 'authenticated') {
    // Regardless of whether they've asked for resources from a specific deployment(s) we want this 'or' array to allow for resources from deployments they are a specific user of.
    // N.B. we don't wasnt to include public deployments in here (i.e. ones they don't have specific rights to), because it would defeat the point of having a 'listed' property.
    const {deployments: usersDeployments} = await getDeployments({user: user.id}, {mineOnly: true});
    const usersDeploymentIds = usersDeployments.map((deployment): string => deployment.id);
    orArray.push({belongsToDeployment: {in: usersDeploymentIds}});
  }

  return orArray;

}