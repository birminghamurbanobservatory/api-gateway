import {cloneDeep} from 'lodash';


export function convertQueryToWhere(query: any): any {

  const where = cloneDeep(query);
  const separator = '__';

  Object.keys(where).forEach((key): void => {
    if (key.includes(separator)) {
      const parts = key.split(separator);
      const newKey = parts[0];
      const conditional = parts[1];
      where[newKey] = {};
      where[newKey][conditional] = where[key];
      delete where[key];
    }
  });

  return where;

}