import * as joi from '@hapi/joi';
import {stringArrayConditional} from './custom-joi-validations';

describe('Test stringArrayConditional method', () => {

  test('Check it returns an array', () => {
    
    const querySchema = joi.object({
      inDeployment__in: joi.string().custom(stringArrayConditional)
    });

    const exampleQuery = {
      inDeployment__in: 'deployment-1,deployment-2'
    };
    
    const {error: queryErr, value: query} = querySchema.validate(exampleQuery);

    expect(queryErr).toBeUndefined();
    expect(query).toEqual({
      inDeployment__in: [
        'deployment-1',
        'deployment-2'
      ]
    });

  });


  test('There is an error object when invalid __in query parameter', () => {
    
    const querySchema = joi.object({
      inDeployment__in: joi.string().custom(stringArrayConditional)
    });

    const exampleQuery = {
      inDeployment__in: 'deployment-1,,deployment-2'
    };
    
    const {error: queryErr} = querySchema.validate(exampleQuery);

    expect(queryErr).toBeInstanceOf(Error);
    expect(queryErr.name).toBe('ValidationError');

  });


});