import {recursivelyRemoveProtectedHostedPlatforms} from './platform.helpers';

describe('Testing of recursivelyRemoveProtectedHostedPlatforms', () => {

  test('Should filter out the protected platforms', () => {
    
    const platform = {
      id: 'p-1',
      inDeployments: ['d-1', 'd-2'], // won't look at this as it's not the job of this function to check the top level platform
      hosts: [
        {
          id: 'p-2',
          type: 'platform',
          inDeployments: ['d1'],
          hosts: [
            {
              id: 'p-4',
              type: 'platform',
              inDeployments: ['d1']
            },
            {
              id: 's-2',
              type: 'sensor'
            }
          ]
        }, {
          id: 'p-3',
          type: 'platform',
          inDeployments: ['d2'],
          hosts: [
            {
              id: 'p-5',
              inDeployments: ['d3', 'd4'] // although one of these is safe, it's host by a platform that isn't 
            }
          ]
        },
        {
          id: 's-1',
          type: 'sensor'
        }
      ]
    };

    const safeDeploymentIds = ['d1', 'd3'];

    const expected = {
      id: 'p-1',
      inDeployments: ['d-1', 'd-2'], // won't look at this as it's not the job of this function to check the top level platform
      hosts: [
        {
          id: 'p-2',
          type: 'platform',
          inDeployments: ['d1'],
          hosts: [
            {
              id: 'p-4',
              type: 'platform',
              inDeployments: ['d1']
            },
            {
              id: 's-2',
              type: 'sensor'
            }
          ]
        },
        {
          id: 's-1',
          type: 'sensor'
        }
      ]
    };

    const platformSafeForUser = recursivelyRemoveProtectedHostedPlatforms(platform, safeDeploymentIds);
    expect(platformSafeForUser).toEqual(expected);

  });

});