import {cloneDeep, uniq, concat} from 'lodash';
import * as check from 'check-types';


export function populateIdArrayWithCollection(idArray: string[], collection: any[]): any[] {

  const populated = idArray.map((id): any => {
    return populateIdFromCollection(id, collection);
  });

  return populated;

}


export function populateIdFromCollection(id: string, collection: any[]): any {
  const found = collection.find((member) => member.id === id);
  return cloneDeep(found) || {id};
}


export function retrieveAllPropertyIdsFromCollection(collection: any[], key: string): string[] {

  const ids = collection.reduce((idsSoFar, item): string[] => {
    let updatedIdsSoFar = idsSoFar;
    if (check.assigned(item[key])) {
      updatedIdsSoFar = concat(idsSoFar, item[key]);
    }
    return updatedIdsSoFar;
  }, []);

  const uniqueIds = uniq(ids);

  return uniqueIds;

}