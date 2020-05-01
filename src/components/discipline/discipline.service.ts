import {CollectionOptions} from '../common/collection-options.class';
import {getDisciplinesObject} from '../vocab/vocab.service';
import {DisciplineNotFound} from './errors/DisciplineNotFound';
import {cloneDeep, sortBy, pick} from 'lodash';
import * as check from 'check-types';

// For now at least the disciplines are loaded from a local JSON file at startup. 
const disciplinesObject = getDisciplinesObject();
let disciplinesArray = [];
Object.keys(disciplinesObject).forEach((disciplineId): void => {
  const copy = cloneDeep(disciplinesObject[disciplineId]);
  const discipline = pick(copy, ['label', 'comment']);
  discipline.id = disciplineId;
  disciplinesArray.push(discipline);
});
disciplinesArray = sortBy(disciplinesArray, 'id');


export async function getDiscipline(disciplineId): Promise<any> {

  const discipline = disciplinesArray.find((discipline): any => discipline.id === disciplineId);

  if (!discipline) {
    throw new DisciplineNotFound(`Failed to find discipline with id: ${disciplineId}`);
  }

  return discipline;
}


export async function getDisciplines(where: {id?: any} = {}, options: CollectionOptions = {}): Promise<any> {

  const offset = check.assigned(options.offset) ? options.offset : 0;
  const limit = check.assigned(options.limit) ? options.limit : 100;

  let disciplines = disciplinesArray;

  if (where.id && where.id.in) {
    disciplines = disciplines.filter((discipline): boolean => where.id.in.includes(discipline.id));
  }

  disciplines = disciplines.slice(offset, limit + offset);

  return {
    disciplines,
    count: disciplines.length,
    total: disciplinesArray.length
  };
}
