import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'comment'];


export function formatIndividualUsedProcedure(usedProcedure: any): any {
  const usedProcedureLinked = cloneDeep(usedProcedure);
  usedProcedureLinked['@type'] = 'UsedProcedure';
  const renamed = renameProperties(usedProcedureLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualUsedProcedureCondensed(usedProcedure: any): object {
  const linked = formatIndividualUsedProcedure(usedProcedure);
  // Pull out the properties we don't need
  const removableProps = [];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createUsedProcedureResponse(usedProcedure: any): object {

  const usedProcedureWithContext = formatIndividualUsedProcedure(usedProcedure);

  usedProcedureWithContext['@context'] = [
    contextLinks.usedProcedure
  ];

  const ordered = orderObjectKeys(usedProcedureWithContext, keyOrder);
  return ordered;

}


export function createUsedProceduresResponse(usedProcedures: any[], extraInfo: {count: number; total: number}): object {

  const usedProceduresLd = usedProcedures.map(formatIndividualUsedProcedure);

  const usedProceduresWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.usedProcedure
    ],
    '@id': `${config.api.base}/used-procedures`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: usedProceduresLd,
    meta: extraInfo
  };

  return usedProceduresWithContext;

}