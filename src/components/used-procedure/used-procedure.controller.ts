import {CollectionOptions} from '../common/collection-options.class';
import * as usedProcedureService from './used-procedure.service';
import {createUsedProcedureResponse, createUsedProceduresResponse} from './used-procedure.formatter';



export async function getUsedProcedure(usedProcedureId: string): Promise<any> {

  const usedProcedure = await usedProcedureService.getUsedProcedure(usedProcedureId);
  const usedProcedureWithContext = createUsedProcedureResponse(usedProcedure);
  return usedProcedureWithContext;

}




export async function getUsedProcedures(where, options: CollectionOptions): Promise<any> {

  const {usedProcedures, count, total} = await usedProcedureService.getUsedProcedures(where, options);
  const usedProceduresWithContext = createUsedProceduresResponse(usedProcedures, {count, total});
  return usedProceduresWithContext;

}