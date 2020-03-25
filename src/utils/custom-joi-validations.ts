import * as check from 'check-types';
import {kebabCaseRegex} from './regular-expressions';


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


export function ancestorPlatformConditional(value): string[] {

  const items = value.split('.');

  // Check each is a non-empty string
  items.forEach((item): void => {
    if (check.not.nonEmptyString(item)) {
      throw new Error('each dot separated ancester platform should be non-empty string');
    }
    if (!kebabCaseRegex.test(item)) {
      throw new Error('each dot separated ancester platform should be kebab-case');
    }
  });

  return items;
}


export function kebabCaseValidation(value): string[] {
  if (!kebabCaseRegex.test(value)) {
    throw new Error('value should be kebab-case');
  }
  return value;
}




