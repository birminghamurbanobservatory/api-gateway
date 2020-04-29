import {cloneDeep} from 'lodash';
import {queryObjectToQueryString} from '../../utils/query-object-to-querystring';
import * as check from 'check-types';

export function addMetaLinks(jsonResponse: any, urlBase: string, query: any): any {

  const currentQuerystring = queryObjectToQueryString(query);

  jsonResponse.meta.current = {
    '@id': `${urlBase}?${currentQuerystring}`
  };
  jsonResponse.meta.current = Object.assign({}, jsonResponse.meta.current, query);

  let isNext;
  if (check.assigned(jsonResponse.meta.total)) {
    isNext = jsonResponse.meta.total > (jsonResponse.meta.count + query.offset);
  } else {
    // This is bit of a quick and dirty approach for when we don't know the total. In theory we could add a next link when we shouldn't if the actual total is the same as the limit.
    isNext = jsonResponse.meta.count === query.limit; 
  }

  const isPrevious = query.offset !== 0;

  if (isNext) {
    const nextQuery = cloneDeep(query);
    nextQuery.offset = nextQuery.offset + nextQuery.limit;
    const nextQuerystring = queryObjectToQueryString(nextQuery);
    jsonResponse.meta.next = {
      '@id': `${urlBase}?${nextQuerystring}`
    };
    jsonResponse.meta.next = Object.assign({}, jsonResponse.meta.next, nextQuery);
  }

  if (isPrevious) {
    const previousQuery = cloneDeep(query);
    previousQuery.offset = Math.max(previousQuery.offset - previousQuery.limit, 0);
    const previousQuerystring = queryObjectToQueryString(previousQuery);
    jsonResponse.meta.previous = {
      '@id': `${urlBase}?${previousQuerystring}`
    };
    jsonResponse.meta.previous = Object.assign({}, jsonResponse.meta.previous, previousQuery);
  }  

  return jsonResponse;

}