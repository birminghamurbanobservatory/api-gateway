import {CollectionOptions} from '../common/collection-options.class';
import * as disciplineService from './discipline.service';
import {createDisciplineResponse, createDisciplinesResponse} from './discipline.formatter';



export async function getDiscipline(disciplineId: string): Promise<any> {

  const discipline = await disciplineService.getDiscipline(disciplineId);
  const disciplineWithContext = createDisciplineResponse(discipline);
  return disciplineWithContext;

}




export async function getDisciplines(where, options: CollectionOptions): Promise<any> {

  const {disciplines, count, total} = await disciplineService.getDisciplines(where, options);
  const disciplinesWithContext = createDisciplinesResponse(disciplines, {count, total});
  return disciplinesWithContext;

}