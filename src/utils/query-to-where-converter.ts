import {cloneDeep} from 'lodash';
import * as check from 'check-types';


export function convertQueryToWhere(query: any): any {

  const where = cloneDeep(query);
  const separator = '__';

  Object.keys(where).forEach((key): void => {
    if (key.includes(separator)) {
      const parts = key.split(separator);
      const newKey = parts[0];
      const modifierOne = parts[1];

      if (check.not.object(where[newKey])) {
        where[newKey] = {};
      }

      // e.g. resultTime__in
      if (parts.length === 2) {
        where[newKey][modifierOne] = where[key];
      }

      // e.g. inTimeseries__not__in
      if (parts.length === 3) {
        const modifierTwo = parts[2];

        if (check.not.object(where[newKey][modifierOne])) {
          where[newKey][modifierOne] = {};
        }

        where[newKey][modifierOne][modifierTwo] = where[key];
      }

      delete where[key];
    }
  });

  return where;

}