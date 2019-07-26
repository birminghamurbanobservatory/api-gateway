//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import {statusCodeToStatus} from './status-code-to-status';

//-------------------------------------------------
// Tests
//-------------------------------------------------
describe('statusCodeToStatus function testing', () => {

  test('Returns expected response for valid statusCode', () => {
    expect(statusCodeToStatus(404)).toBe('Not Found');
  });

  test('Returns undefined when given an statusCode that is not in the dictionary', () => {
    expect(statusCodeToStatus(999)).toBe(undefined);
  });  

});

