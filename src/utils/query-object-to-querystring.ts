import * as check from 'check-types';

export function queryObjectToQueryString(query: any): string {

  if (!query || Object.keys(query).length === 0) {
    return '';
  }

  const elements = [];

  Object.keys(query).forEach((key): void => {

    const value = query[key];

    if (check.array(value)) {
      // Special case for ancestorPlatforms parameter which needs to be dot separated
      const separator = key === 'ancestorPlatforms' ? '.' : ',';
      elements.push(`${key}=${value.join(separator)}`);
    } else {
      elements.push(`${key}=${value}`);
    }

  });

  return elements.join('&');

}