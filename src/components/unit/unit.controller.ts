import {CollectionOptions} from '../common/collection-options.class';
import * as unitService from './unit.service';
import {createUnitResponse, createUnitsResponse} from './unit.formatter';



export async function getUnit(unitId: string): Promise<any> {

  const unit = await unitService.getUnit(unitId);
  const unitWithContext = createUnitResponse(unit);
  return unitWithContext;

}




export async function getUnits(where, options: CollectionOptions): Promise<any> {

  const {units, count, total} = await unitService.getUnits(where, options);
  const unitsWithContext = createUnitsResponse(units, {count, total});
  return unitsWithContext;

}