import * as _ from 'lodash';
import * as check from 'check-types';


/**
 * Orders the properties of an object
 * @param obj The object that needs ordering 
 * @param order An array of object keys in the order you want them to appear in the object when it's printed out or converted to JSON. This can be a partial list of keys, whatever keys are left will still be added.
 */
export default function orderObjectKeys(obj: object, order?: string[]): object {

  // Default to alphabetical
  const alphaOrder = Object.keys(obj).sort();
  const customOrder = order || [];

  const mergedKeys = _.concat(customOrder, alphaOrder);
  const uniqueKeys = _.uniq(mergedKeys);  

  const orderedObj = {};

  uniqueKeys.forEach((key): void => {
    if (check.assigned(obj[key])) {
      orderedObj[key] = obj[key];
    }
  });

  return orderedObj;

}