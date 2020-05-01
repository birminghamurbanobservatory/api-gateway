import {CollectionOptions} from '../common/collection-options.class';
import {NotFound} from '../../errors/NotFound';


export async function getUsedProcedure(usedProcedureId): Promise<any> {

  // TODO
  throw new NotFound(`Failed to find a used procedure with id: ${usedProcedureId}`);

}



export async function getUsedProcedures(where: {id?: any} = {}, options: CollectionOptions = {}): Promise<any> {

  const usedProcedures = [];

  return {
    usedProcedures,
    count: usedProcedures.length,
    total: 0 // TODO
  };

}
