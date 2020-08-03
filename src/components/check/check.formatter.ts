import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'checkType', 'appliesTo', 'config', 'createdAt', 'updatedAt'];


export function formatIndividualCheck(check: any): any {
  const checkLinked = cloneDeep(check);
  checkLinked['@type'] = 'Check';
  // For now at least I don't want the end users seeing who created the check
  delete checkLinked.createdBy;
  const renamed = renameProperties(checkLinked, {
    id: '@id'
  });
  renamed.appliesTo = renameProperties(renamed.appliesTo, {
    hostedByPath: 'ancestorPlatforms',
    hostedByPathIncludes: 'ancestorPlatformsIncludes'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}



export function createCheckResponse(check: any): object {

  const checkWithContext = formatIndividualCheck(check);

  checkWithContext['@context'] = [
    contextLinks.check
  ];

  const ordered = orderObjectKeys(checkWithContext, keyOrder);
  return ordered;

}


export function createChecksResponse(checks: any[], extraInfo: {count: number; total: number}): object {

  const checksLd = checks.map(formatIndividualCheck);

  const checksWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.check
    ],
    '@id': `${config.api.base}/checks`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: checksLd,
    meta: extraInfo
  };

  return checksWithContext;

}