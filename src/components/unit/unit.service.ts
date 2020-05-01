import {CollectionOptions} from '../common/collection-options.class';
import {getUnitsObject} from '../vocab/vocab.service';
import {UnitNotFound} from './errors/UnitNotFound';
import {cloneDeep, sortBy, pick} from 'lodash';
import * as check from 'check-types';

// For now at least the units are loaded from a local JSON file at startup. 
const unitsObject = getUnitsObject();
let unitsArray = [];
Object.keys(unitsObject).forEach((unitId): void => {
  const copy = cloneDeep(unitsObject[unitId]);
  const unit = pick(copy, ['label', 'comment']);
  unit.id = unitId;
  unitsArray.push(unit);
});
unitsArray = sortBy(unitsArray, 'id');


export async function getUnit(unitId): Promise<any> {

  const unit = unitsArray.find((unit): any => unit.id === unitId);

  if (!unit) {
    throw new UnitNotFound(`Failed to find unit with id: ${unitId}`);
  }

  return unit;
}


export async function getUnits(where: {id?: any} = {}, options: CollectionOptions = {}): Promise<any> {

  const offset = check.assigned(options.offset) ? options.offset : 0;
  const limit = check.assigned(options.limit) ? options.limit : 100;

  let units = unitsArray;

  if (where.id && where.id.in) {
    units = units.filter((unit): boolean => where.id.in.includes(unit.id));
  }

  units = units.slice(offset, limit + offset);

  return {
    units,
    count: units.length,
    total: unitsArray.length
  };
}
