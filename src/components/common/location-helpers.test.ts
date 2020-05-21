import {locationClientToApp} from './location-helpers';


describe('Testing locationClientToApp function', () => {

  test('Should convert as expected', () => {
    
    const clientLocation = {
      geometry: {
        type: 'Point',
        coordinates: [-1.9, 52.5]
      },
      properties: {
        height: 5
      }
    };

    const expected = {
      geometry: {
        type: 'Point',
        coordinates: [-1.9, 52.5]
      },
      height: 5
    };

    const appLocation = locationClientToApp(clientLocation);
    expect(appLocation).toEqual(expected);

  });

});