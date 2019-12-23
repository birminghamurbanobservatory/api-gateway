import * as check from 'check-types';

export function inConditional(value): string[] {

  const items = value.split(',');

  // Check each is a non-empty string
  items.forEach((item): void => {
    if (check.not.nonEmptyString(item)) {
      throw new Error('each comma separated value should be non-empty string');
    }
  });

  return items;

}

