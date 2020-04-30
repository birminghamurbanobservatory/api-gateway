import {recursivelyRemoveProtectedHostedPlatforms} from './platform.helpers';

describe('Testing of recursivelyRemoveProtectedHostedPlatforms', () => {

  test('Should filter out the protected platforms', () => {
    
    const platform = {
      id: 'p-1',
      inDeployment: 'd-1',
      hosts: [
        {
          id: 'p-2',
          type: 'platform',
          inDeployment: 'd1',
          hosts: [
            {
              id: 'p-4',
              type: 'platform',
              inDeployment: 'd1'
            },
            {
              id: 's-2',
              type: 'sensor'
            }
          ]
        }, {
          id: 'p-3',
          type: 'platform',
          inDeployment: 'd2',
          hosts: [
            {
              id: 'p-5',
              inDeployment: 'd3',
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
      inDeployment: 'd-1',
      hosts: [
        {
          id: 'p-2',
          type: 'platform',
          inDeployment: 'd1',
          hosts: [
            {
              id: 'p-4',
              type: 'platform',
              inDeployment: 'd1'
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