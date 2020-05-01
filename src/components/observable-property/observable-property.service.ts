import {CollectionOptions} from '../common/collection-options.class';
import {getObservablePropertiesObject} from '../vocab/vocab.service';
import {ObservablePropertyNotFound} from './errors/ObservablePropertyNotFound';
import {cloneDeep, sortBy, pick} from 'lodash';
import * as check from 'check-types';

// For now at least the observableProperties are loaded from a local JSON file at startup. 
const observablePropertiesObject = getObservablePropertiesObject();
let observablePropertiesArray = [];
Object.keys(observablePropertiesObject).forEach((observablePropertyId): void => {
  const copy = cloneDeep(observablePropertiesObject[observablePropertyId]);
  const observableProperty = pick(copy, ['label', 'comment']);
  observableProperty.id = observablePropertyId;
  observablePropertiesArray.push(observableProperty);
});
observablePropertiesArray = sortBy(observablePropertiesArray, 'id');


export async function getObservableProperty(observablePropertyId): Promise<any> {

  const observableProperty = observablePropertiesArray.find((observableProperty): any => observableProperty.id === observablePropertyId);

  if (!observableProperty) {
    throw new ObservablePropertyNotFound(`Failed to find observable property with id: ${observablePropertyId}`);
  }

  return observableProperty;
}


export async function getObservableProperties(where: {id?: any} = {}, options: CollectionOptions = {}): Promise<any> {

  const offset = check.assigned(options.offset) ? options.offset : 0;
  const limit = check.assigned(options.limit) ? options.limit : 100;

  let observableProperties = observablePropertiesArray;

  if (where.id && where.id.in) {
    observableProperties = observableProperties.filter((observableProperty): boolean => where.id.in.includes(observableProperty.id));
  }

  observableProperties = observableProperties.slice(offset, limit + offset);

  return {
    observableProperties,
    count: observableProperties.length,
    total: observablePropertiesArray.length
  };
}
