import {tidyUrbanObsVocab, deconstructPrefixSuffixId} from './vocab.service';
import * as urbanObsVocabBackup from './backup-urban-obs-vocab.json';
import * as check from 'check-types';


describe('Testing of tidyUrbanObsVocab function', () => {

  test('Succesfully parses the backup Urban Obs Vocab', () => {
    
    const tidied = tidyUrbanObsVocab(urbanObsVocabBackup);
    expect(check.nonEmptyObject(tidied)).toBe(true);
    expect(check.nonEmptyArray(tidied.disciplines)).toBe(true);
    expect(check.nonEmptyArray(tidied.observableProperties)).toBe(true);
    expect(check.nonEmptyArray(tidied.units)).toBe(true);


  });

});


describe('Testing of deconstructPrefixSuffixId function', () => {

  test('Correctly process a prefix:suffix id with context available', () => {

    const id = 'schema:Person';
    const context = {
      schema: 'https://schema.org/'
    };
    const expected = {
      idExpanded: 'https://schema.org/Person',
      idNoPrefix: 'Person',
      idWithPrefix: 'schema:Person'
    };

    const deconstructed = deconstructPrefixSuffixId(id, context);
    expect(deconstructed).toEqual(expected);

  });


  test('Can handle a prefix:suffix id where the required context key is not present', () => {

    const id = 'schema:Person';
    const context = {
      someOtherSchema: 'https://some-other-schema.org/'
    };
    const expected = {
      idNoPrefix: 'Person',
      idWithPrefix: 'schema:Person'
    };

    const deconstructed = deconstructPrefixSuffixId(id, context);
    expect(deconstructed).toEqual(expected);

  });




});