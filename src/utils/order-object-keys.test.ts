import orderObjectKeys from './order-object-keys';
import * as check from 'check-types';

//-------------------------------------------------
// Tests
//-------------------------------------------------
describe('Test orderObjectKeys function', () => {

  test('It reformats an object correctly when given full order', () => {
    
    const unorderedObject = {
      c: 1,
      b: 1,
      d: 1,
      a: 1
    };
    const order = ['d', 'a', 'b', 'c'];
    const expected = {
      d: 1,
      a: 1,
      b: 1,
      c: 1      
    };
    const result = orderObjectKeys(unorderedObject, order);
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));

  });


  test('It reformats an object correctly when given a partial order', () => {
    
    const unorderedObject = {
      c: 1,
      b: 1,
      d: 1,
      a: 1
    };
    const order = ['b', 'd'];
    const expected = {
      b: 1,
      d: 1,
      a: 1,
      c: 1      
    };
    const result = orderObjectKeys(unorderedObject, order);
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));

  });


  test('It reformats an object alphabetically when given no order', () => {
    
    const unorderedObject = {
      c: 1,
      b: 1,
      d: 1,
      a: 1
    };
    const expected = {
      a: 1,
      b: 1,
      c: 1,
      d: 1      
    };
    const result = orderObjectKeys(unorderedObject);
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));

  });


  test('Can handle keys in the order that do not exist in the object', () => {
    
    const unorderedObject = {
      c: 1,
      b: 1,
      d: 1,
      a: 1
    };
    const order = ['a', 'c', 'b', 'd', 'f'];
    const expected = {
      a: 1,
      c: 1,
      b: 1,
      d: 1      
    };
    const result = orderObjectKeys(unorderedObject, order);
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
    expect(Object.keys(result).includes('f')).toBe(false);

  });



});

