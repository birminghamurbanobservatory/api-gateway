import {queryObjectToQueryString} from './query-object-to-querystring';

describe('Testing of queryObjectToQueryString function', () => {

  test('Should covert object to string as expected', () => {

    const queryObject = {
      resultTime__gte: '2020-04-02T17:55:27.748Z',
      inDeployments: ['dep-1', 'dep-2'],
      ancestorPlatforms: ['a', 'b', 'c']
    };

    const expected = 'resultTime__gte=2020-04-02T17:55:27.748Z&inDeployments=dep-1,dep-2&ancestorPlatforms=a.b.c';

    const querystring = queryObjectToQueryString(queryObject);
    expect(querystring).toBe(expected);    

  });

});