import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'comment'];


export function formatIndividualDiscipline(discipline: any): any {
  const disciplineLinked = cloneDeep(discipline);
  disciplineLinked['@type'] = 'Discipline';
  const renamed = renameProperties(disciplineLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualDisciplineCondensed(discipline: any): object {
  const linked = formatIndividualDiscipline(discipline);
  // Pull out the properties we don't need
  const removableProps = [];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createDisciplineResponse(discipline: any): object {

  const disciplineWithContext = formatIndividualDiscipline(discipline);

  disciplineWithContext['@context'] = [
    contextLinks.discipline
  ];

  const ordered = orderObjectKeys(disciplineWithContext, keyOrder);
  return ordered;

}


export function createDisciplinesResponse(disciplines: any[], extraInfo: {count: number; total: number}): object {

  const disciplinesLd = disciplines.map(formatIndividualDiscipline);

  const disciplinesWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.discipline
    ],
    '@id': `${config.api.base}/disciplines`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: disciplinesLd,
    meta: extraInfo
  };

  return disciplinesWithContext;

}