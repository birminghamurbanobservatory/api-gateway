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


  test('Handles having more than one modifier per parameter', () => {
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


  test('Can handle a __in modifier', () => {
    const query = {
      inTimeseries__in: ['abc', 'def']
    };
    const expectedWhere = {
      inTimeseries: {
        in: ['abc', 'def']
      }   
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });

  
  test('Can handle a __not modifier', () => {
    const query = {
      inTimeseries__not: 'abc'
    };
    const expectedWhere = {
      inTimeseries: {
        not: 'abc'
      }   
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  }); 


  test('Can handle a __not__in modifier', () => {
    const query = {
      inTimeseries__not__in: ['abc', 'def']
    };
    const expectedWhere = {
      inTimeseries: {
        not: {
          in: ['abc', 'def']
        }
      }   
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  }); 


  test('Can handle a __not__in modifier in combination with other modifiers', () => {
    // This would be a really obsecure query to ever actually get called
    const query = {
      someProp__not__in: ['abc', 'def'],
      someProp__includes: 'jkl',
      someOtherProp: '123'
    };
    const expectedWhere = {
      someProp: {
        includes: 'jkl',
        not: {
          in: ['abc', 'def']
        }
      },
      someOtherProp: '123'   
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  }); 


});

