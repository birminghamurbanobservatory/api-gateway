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

  test('Handles __isDefined', () => {
    const query = {
      inDeployment__isDefined: false
    };
    const expectedWhere = {
      inDeployment: {
        isDefined: false
      }
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });  

  test('Handles multiple key conversions', () => {
    const query = {
      inDeployment__isDefined: false,
      value__gte: 20
    };
    const expectedWhere = {
      inDeployment: {
        isDefined: false,
      },
      value: {
        gte: 20
      }      
    };
    expect(convertQueryToWhere(query)).toEqual(expectedWhere);
  });    

});

