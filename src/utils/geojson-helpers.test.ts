import {centroidToGeometry} from './geojson-helpers';


describe('Testing centroidToGeometry function', () => {

  test('Converts a centroid (with height) as expected', () => {
    
    const centroid = {lat: 52.5, lng: -1.9, height: 2};
    const expected = {
      type: 'Point',
      coordinates: [-1.9, 52.5, 2]
    };
    const geometry = centroidToGeometry(centroid);
    expect(geometry).toEqual(expected);

  });


  test('Converts a centroid (without height) as expected', () => {
    
    const centroid = {lat: 52.5, lng: -1.9};
    const expected = {
      type: 'Point',
      coordinates: [-1.9, 52.5]
    };
    const geometry = centroidToGeometry(centroid);
    expect(geometry).toEqual(expected);

  });

});