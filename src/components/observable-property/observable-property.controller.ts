import {CollectionOptions} from '../common/collection-options.class';
import * as observablePropertyService from './observable-property.service';
import {createObservablePropertyResponse, createObservablePropertiesResponse} from './observable-property.formatter';



export async function getObservableProperty(observablePropertyId: string): Promise<any> {

  const observableProperty = await observablePropertyService.getObservableProperty(observablePropertyId);
  const observablePropertyWithContext = createObservablePropertyResponse(observableProperty);
  return observablePropertyWithContext;

}




export async function getObservableProperties(where, options: CollectionOptions): Promise<any> {

  const {observableProperties, count, total} = await observablePropertyService.getObservableProperties(where, options);
  const observablePropertiesWithContext = createObservablePropertiesResponse(observableProperties, {count, total});
  return observablePropertiesWithContext;

}