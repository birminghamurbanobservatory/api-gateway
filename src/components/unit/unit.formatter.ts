import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'comment'];


export function formatIndividualUnit(unit: any): any {
  const unitLinked = cloneDeep(unit);
  unitLinked['@type'] = 'Unit';
  const renamed = renameProperties(unitLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualUnitCondensed(unit: any): object {
  const linked = formatIndividualUnit(unit);
  // Pull out the properties we don't need
  const removableProps = [];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createUnitResponse(unit: any): object {

  const unitWithContext = formatIndividualUnit(unit);

  unitWithContext['@context'] = [
    contextLinks.unit
  ];

  const ordered = orderObjectKeys(unitWithContext, keyOrder);
  return ordered;

}


export function createUnitsResponse(units: any[], extraInfo: {count: number; total: number}): object {

  const unitsLd = units.map(formatIndividualUnit);

  const unitsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.unit
    ],
    '@id': `${config.api.base}/units`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: unitsLd,
    meta: extraInfo
  };

  return unitsWithContext;

}