//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import {convertQueryToWhere} from './query-to-where-converter';
import {cloneDeep} from 'lodash';

//-------------------------------------------------
// Tests
//-------------------------------------------------
describe('convertQueryToWhere function testing', () => {


  test('Lets queries that need no conversion through without modification', () => {
    const query = {
      inDeployment: 'dep123', 
      isHostedBy: 'plat123'
    };
    const expectedWhere = cloneDeep(query);
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });


  test('Handles __exists', () => {
    const query = {
      inDeployment__exists: false
    };
    const expectedWhere = {
      inDeployment: {
        exists: false
      }
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });  


  test('Handles multiple key conversions', () => {
    const query = {
      inDeployment__exists: false,
      value__gte: 20,
      id__begins: 'abc'
    };
    const expectedWhere = {
      inDeployment: {
        exists: false,
      },
      value: {
        gte: 20
      },
      id: {
        begins: 'abc'
      }      
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });    


  test('Handles having more than one conditional per parameter', () => {
    const query = {
      resultTime__gte: '2019-09-15',
      resultTime__lt: '2019-09-16'
    };
    const expectedWhere = {
      resultTime: {
        gte: '2019-09-15',
        lt: '2019-09-16'
      }      
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });  


  test('Can handle a search key', () => {
    const query = {
      search: 'rain'
    };
    const expectedWhere = {
      search: 'rain'    
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });  

  


});

