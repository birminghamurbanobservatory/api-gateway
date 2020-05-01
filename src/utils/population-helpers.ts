import {cloneDeep} from 'lodash';


export function populateIdArrayWithCollection(idArray: string[], collection: any[]): any[] {

  const populated = idArray.map((id) => {
    return populateIdFromCollection(id, collection);
  });

  return populated;

}


export function populateIdFromCollection(id: string, collection: any[]): any {
  const found = collection.find((member) => member.id === id);
  return cloneDeep(found) || {id};
}