import axios from 'axios';
import * as capitalize from 'capitalize';
import {config} from '../../config';
import * as logger from 'node-logger';
import {cloneDeep, keyBy} from 'lodash';
import * as urbanObsVocabBackup from './backup-urban-obs-vocab.json';
import {TidiedUrbanObsVocab} from './tidied-urban-obs-vocab.class';
import {DeconstructedId} from './deconstructed-id.class';


const urbanObsVocabUrl = config.api.uoVocab;
const uoAliasValue = `${config.api.base}/vocab/uo/#`;

let urbanObsVocabCached;
let urbanObsVocabTimestamp;

let tidiedUrbanObsVocabCached;
let tidedUrbanObsVocabTimestamp;


export async function getUrbanObsVocabTidied(useCached = true, cacheExpirySecs = 60): Promise<TidiedUrbanObsVocab> {

  // Check if we can use the cached version
  if (tidiedUrbanObsVocabCached 
    && tidedUrbanObsVocabTimestamp
    && useCached === true
    && ((tidedUrbanObsVocabTimestamp.getTime() + (cacheExpirySecs * 1000)) > new Date().getTime())
  ) {
    //------------------------
    // Use cache
    //------------------------
    logger.debug('Using cached tidy vocab');
    return tidiedUrbanObsVocabCached;

  } else {
    //------------------------
    // Get fresh
    //------------------------
    // N.B. if useCached is true and we got the raw vocab more recently that we built a tidied version, then we will use a cache of the raw vocab.
    logger.debug('Getting fresh tidy vocab');
    const rawVocab = await getUrbanObsVocab(useCached, cacheExpirySecs);

    // At the time of writing the JSON vocabularly available at the URL in the line above doesn't define an alias for "uo". I'm going to define my own here so that I can add it to the context that's used to deconstruct @id's. When it comes to the ejs rendered html the hyperlinks within that point to other uo definitions should jump to elsewhere on the page.   
    rawVocab['@context'].uo = uoAliasValue;

    // Here we try to make sure we're not vunerable to breaking changes to the live UO vocabularly. If the following fails then we'll use the backup vocabularly instead.
    let vocabTidy;
    try {
      vocabTidy = tidyUrbanObsVocab(rawVocab);
      tidiedUrbanObsVocabCached = cloneDeep(vocabTidy);
      tidedUrbanObsVocabTimestamp = new Date();
    } catch (err) {
      logger.error('Failed to tidy the Urban Obs Vocab that has come from the common external source.', err);
      vocabTidy = tidyUrbanObsVocab(urbanObsVocabBackup);
    }

    return vocabTidy;

  }

}


export function tidyUrbanObsVocab(rawVocab): TidiedUrbanObsVocab {

  const vocabTidy: any = {};

  const vocabArray = rawVocab.defines;

  vocabTidy.disciplines = vocabArray
    .filter((definition): boolean => definition['@type'] === 'uo:Discipline')
    .map((definition): any => {
      return commonDefinitionTidying(definition, rawVocab['@context']);
    })
    .sort(sortAlphabetically);

  vocabTidy.observableProperties = vocabArray
    .filter((definition): boolean => definition['@type'] === 'sosa:ObservableProperty')
    .map((definition): any => {
      return commonDefinitionTidying(definition, rawVocab['@context']);
    })
    .map((definition): any => {
      if (definition.recommendedUnits) {
        definition.recommendedUnits = definition.recommendedUnits.map((unitId): any => {
          return deconstructPrefixSuffixId(unitId, rawVocab['@context']);
        })
      }
      return definition;
    })
    .sort(sortAlphabetically);

  vocabTidy.units = vocabArray
    .filter((definition): boolean => definition['@type'] === 'uo:Unit')
    .map((definition): any => {
      return commonDefinitionTidying(definition, rawVocab['@context']);
    })
    .sort(sortAlphabetically);

  return vocabTidy;

}


function commonDefinitionTidying(definition, context): any {
  const deconstructedId = deconstructPrefixSuffixId(definition['@id'], context);
  const tidyDefinition = Object.assign({}, definition, deconstructedId);
  delete tidyDefinition['@id'];
  tidyDefinition.type = tidyDefinition['@type'];
  delete tidyDefinition['@type'];
  tidyDefinition.labelCapitalised = capitalize.words(tidyDefinition.label);
  if (tidyDefinition.sameAs) {
    tidyDefinition.sameAs = tidyDefinition.sameAs.map((sameAsId): any => {
      return deconstructPrefixSuffixId(sameAsId, context);
    });
  }
  return tidyDefinition;
}


function sortAlphabetically(a, b): number {
  const sortBy = 'label';
  return a[sortBy] < b[sortBy] ? -1 : 1;
}


export function deconstructPrefixSuffixId(id: string, context: any): DeconstructedId {

  const deconstructed: DeconstructedId = {};

  const [partA, partB] = id.split(':');
  let prefix;
  let uniquePart;
  if (partB) {
    prefix = partA;
    uniquePart = partB;
  } else {
    uniquePart = partA;
  }

  deconstructed.idNoPrefix = uniquePart;
  deconstructed.idWithPrefix = id;

  if (prefix && context[prefix]) {
    deconstructed.idExpanded = `${context[prefix]}${uniquePart}`;
  }

  return deconstructed;

}


export async function getUrbanObsVocab(useCached = true, cacheExpirySecs = 60): Promise<any> {

  if (!urbanObsVocabUrl) {
    throw new Error('Unknown source of UO vocabulary');
  }
  const url = urbanObsVocabUrl;

  // Check if we can use the cached version
  if (urbanObsVocabCached 
    && urbanObsVocabTimestamp 
    && useCached 
    && ((urbanObsVocabTimestamp.getTime() + (cacheExpirySecs * 1000)) > new Date().getTime())
  ) {
    //------------------------
    // Use cache
    //------------------------
    logger.debug('Using cached Urban Obs Vocab');
    return urbanObsVocabCached;

  } else {
    //------------------------
    // Get fresh
    //------------------------
    logger.debug('Getting fresh Urban Obs Vocab');
    let vocab;
    try {
      const response = await axios.get(url);
      vocab = response.data;
      urbanObsVocabCached = cloneDeep(vocab);
      urbanObsVocabTimestamp = new Date(); 
    } catch (err) {
      logger.error(`Failed to get Urban Obs Vocab. Reason: ${err.message}`);
      // We still need to return something, so let's either use our cached version if we have one, or use the local backup.
      if (urbanObsVocabCached) {
        logger.debug('Using cached Urban Obs Vocab instead');
        vocab = urbanObsVocabCached;
      } else {
        logger.debug('Using local back Urban Obs Vocab instead');
        vocab = urbanObsVocabBackup;
      }
    }
    return vocab;

  }

}


// rather than returning an array of unit objects, it returns an object of unit objects, with the unit ids (without a prefix) as the keys.
export function getUnitsObject(): any {
  const vocabTidy = tidyUrbanObsVocab(urbanObsVocabBackup);
  const unitsObject = keyBy(vocabTidy.units, 'idNoPrefix');
  return unitsObject;
}

export function getDisciplinesObject(): any {
  const vocabTidy = tidyUrbanObsVocab(urbanObsVocabBackup);
  const disciplinesObject = keyBy(vocabTidy.disciplines, 'idNoPrefix');
  return disciplinesObject;
}

export function getObservablePropertiesObject(): any {
  const vocabTidy = tidyUrbanObsVocab(urbanObsVocabBackup);
  const observablePropertiesObject = keyBy(vocabTidy.observableProperties, 'idNoPrefix');
  return observablePropertiesObject;
}