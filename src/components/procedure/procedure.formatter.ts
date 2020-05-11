import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'comment', 'listed', 'belongsToDeployment', 'inCommonVocab', 'createdAt', 'updatedAt'];


export function formatIndividualProcedure(procedure: any): any {
  const procedureLinked = cloneDeep(procedure);
  procedureLinked['@type'] = 'Procedure';
  // For now at least I don't want the end users seeing who created the procedure
  delete procedureLinked.createdBy;
  const renamed = renameProperties(procedureLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualProcedureCondensed(procedure: any): object {
  const linked = formatIndividualProcedure(procedure);
  // Pull out the properties we don't need
  const removableProps = ['listed', 'inCommonVocab', 'createdAt', 'updatedAt'];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createProcedureResponse(procedure: any): object {

  const procedureWithContext = formatIndividualProcedure(procedure);

  procedureWithContext['@context'] = [
    contextLinks.procedure
  ];

  const ordered = orderObjectKeys(procedureWithContext, keyOrder);
  return ordered;

}


export function createProceduresResponse(procedures: any[], extraInfo: {count: number; total: number}): object {

  const proceduresLd = procedures.map(formatIndividualProcedure);

  const proceduresWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.procedure
    ],
    '@id': `${config.api.base}/procedures`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: proceduresLd,
    meta: extraInfo
  };

  return proceduresWithContext;

}