import {populateIdArrayWithCollection, populateIdFromCollection, retrieveAllPropertyIdsFromCollection} from './population-helpers';


describe('Testing of populateIdArrayWithCollection function', () => {

  test('Should populate correctly when perfect match for each element', () => {
    
    const idsArray = ['id-1', 'id-2', 'id-3'];
    
    const collection = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
      {id: 'id-3', label: 'id 3'}
    ];

    const expected = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
      {id: 'id-3', label: 'id 3'}
    ];

    const populated = populateIdArrayWithCollection(idsArray, collection);
    expect(populated).toEqual(expected);

  });


  test('Can handle when the collection has more elements that the id array', () => {
    
    const idsArray = ['id-1', 'id-2'];
    
    const collection = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
      {id: 'id-3', label: 'id 3'}
    ];

    const expected = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'}
    ];

    const populated = populateIdArrayWithCollection(idsArray, collection);
    expect(populated).toEqual(expected);

  });


  test('Can handle when the collection has less elements that the id array', () => {
    
    const idsArray = ['id-1', 'id-2', 'id-3'];
    
    const collection = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
    ];

    const expected = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
      {id: 'id-3'} // unabled to populate the label, but worth returning the id in an object like the other elements
    ];

    const populated = populateIdArrayWithCollection(idsArray, collection);
    expect(populated).toEqual(expected);

  });

});



describe('Testing of populateIdFromCollection function', () => {

  test('Can populate when matching collection member is available', () => {
    
    const id = 'id-2';

    const collection = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
      {id: 'id-3', label: 'id 3'}
    ];

    const expected = {id: 'id-2', label: 'id 2'};

    const populated = populateIdFromCollection(id, collection);
    expect(populated).toEqual(expected);

  });


  test('Can handle no matching collection member being found', () => {
    
    const id = 'id-2';

    const collection = [
      {id: 'id-1', label: 'id 1'},
    ];

    const expected = {id: 'id-2'};

    const populated = populateIdFromCollection(id, collection);
    expect(populated).toEqual(expected);

  });


  test('Check it creates a immutable copy of the collection member', () => {
    
    const id = 'id-2';

    const collection = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
      {id: 'id-3', label: 'id 3'}
    ];

    const expectedCollectionAfter = [
      {id: 'id-1', label: 'id 1'},
      {id: 'id-2', label: 'id 2'},
      {id: 'id-3', label: 'id 3'}
    ];

    const populated = populateIdFromCollection(id, collection);
    populated.extraField = 'something';
    expect(collection).toEqual(expectedCollectionAfter);

  });


});


describe('Testing retrieveAllPropertyIdsFromCollection', () => {

  test('Can handle a collection object property that is a string', () => {

    const collection = [
      {deployment: 'id-1'},
      {deployment: 'id-2'},
      {deployment: 'id-3'},
    ];

    const key = 'deployment';

    const expected = ['id-1', 'id-2', 'id-3'];

    const ids = retrieveAllPropertyIdsFromCollection(collection, key);
    expect(ids).toEqual(expected);

  });


  test('Can handle a collection object property that is an array', () => {

    const collection = [
      {deployments: ['id-1']},
      {deployments: ['id-2']},
      {deployments: ['id-3']},
    ];

    const key = 'deployments';

    const expected = ['id-1', 'id-2', 'id-3'];

    const ids = retrieveAllPropertyIdsFromCollection(collection, key);
    expect(ids).toEqual(expected);

  });


  test('Can handle duplicate ids in arrays', () => {

    const collection = [
      {deployments: ['id-1']},
      {deployments: ['id-1', 'id-2']},
      {deployments: ['id-3']},
    ];

    const key = 'deployments';

    const expected = ['id-1', 'id-2', 'id-3'];

    const ids = retrieveAllPropertyIdsFromCollection(collection, key);
    expect(ids).toEqual(expected);

  });



});