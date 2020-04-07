import axios from 'axios';
import * as capitalize from 'capitalize';
import {config} from '../../config';


export async function getUrbanObsVocabTidied(): Promise<any> {

  const rawVocab = await getUrbanObsVocabRaw();

  const vocabArray = rawVocab.defines;

  const vocabTidy: any = {};

  vocabTidy.disciplines = vocabArray
    .filter((item): boolean => item['@type'] === 'uo:Discipline')
    .map((item): any => {
      item.id = item['@id'];
      item.id = item.id.replace('uo:', '');
      delete item['@id'];
      item.type = item['@type'];
      delete item['@type'];
      item.labelCapitalised = capitalize.words(item.label);
      return item;
    })
    .sort((a, b): number => {
      return a.id < b.id ? -1 : 1;
    });

  vocabTidy.observableProperties = vocabArray
    .filter((item): boolean => item['@type'] === 'sosa:ObservableProperty')
    .map((item): any => {
      item.id = item['@id'];
      item.id = item.id.replace('uo:', '');
      delete item['@id'];
      item.type = item['@type'];
      delete item['@type'];
      item.labelCapitalised = capitalize.words(item.label);
      return item;
    })
    .sort((a, b): number => {
      return a.id < b.id ? -1 : 1;
    });

  vocabTidy.units = vocabArray
    .filter((item): boolean => item['@type'] === 'uo:Unit')
    .map((item): any => {
      item.id = item['@id'];
      item.id = item.id.replace('uo:', '');
      delete item['@id'];
      item.type = item['@type'];
      delete item['@type'];
      item.labelCapitalised = capitalize.words(item.label);
      return item;
    })
    .sort((a, b): number => {
      return a.id < b.id ? -1 : 1;
    });

  return vocabTidy;

}



async function getUrbanObsVocabRaw(): Promise<any> {

  if (!config.api.uoVocab) {
    throw new Error('Unknown source of UO vocabulary');
  }
  const url = config.api.uoVocab;

  // TODO: Handle errors better.
  const response = await axios.get(url);
  return response.data;

}