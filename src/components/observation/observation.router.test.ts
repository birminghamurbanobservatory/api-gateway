//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import supertest from 'supertest';
import * as logger from 'node-logger';
import {config} from '../../config';
import {getObservations} from './observation.service';
import {getDeployments} from '../deployment/deployment.service';
import {contextLinks} from '../context/context.service';

const apiBase = config.api.base;

//-------------------------------------------------
// Mocks
//-------------------------------------------------
jest.mock('./observation.service.ts');
const mockedGetObservations = getObservations as jest.Mock;

jest.mock('../deployment/deployment.service');
const mockedGetDeployments = getDeployments as jest.Mock;


//-------------------------------------------------
// Tests
//-------------------------------------------------
describe('', () => {

  let request;

  beforeAll(async () => {
    // Configure the logger
    logger.configure(config.logger);
  });

  beforeEach(() => {
    // Load our express.js app
    const app = require('../../routes').app;
    request = supertest(app);
  });

  afterEach(() => {
    // Reset mock.calls and mock.instances properties of all mocks
    jest.clearAllMocks();    
  }); 


  test('Get observations', async () => {

    expect.assertions(1); // Supertest's .expect()'s don't count towards the total.

    mockedGetDeployments.mockResolvedValue([{
      id: 'deployment-1',
      name: 'Deployment 1',
      description: 'some info',
      public: true,
      users: ['bob'],
      createdAt: '2020-01-09T14:11:55.263Z',
      updatedAt: '2020-03-09T14:12:35.265Z'
    }]);

    mockedGetObservations.mockResolvedValue([
      {
        id: '803-111-2020-03-09T10:17:37.000Z',
        resultTime: '2020-03-09T10:17:37.000Z',
        hasResult: {
          value: 78
        },
        madeBySensor: 'netatmo-02-00-00-3f-16-4c-humidity',
        observedProperty: 'RelativeHumidity',
        hasFeatureOfInterest: 'EarthAtmosphere',
        inDeployments: [
          'netatmo-gatekeepers'
        ],
        hostedByPath: [
          'forestdale-primary-school',
          'netatmo-02-00-00-3f-16-4c-r4e'
        ],
        discipline: [
          'Meteorology'
        ],
        location: {
          id: '7164feea-d076-4ffa-8d48-c09643656f43',
          geometry: {
            type: 'Point',
            coordinates: [
              -2.004847526550293,
              52.4073600769043
            ]
          },
          validAt: '2020-02-13T20:30:32.007Z'
        },
        usedProcedure: [
          'PointSample'
        ]
      }
    ]);

    const response = await request
    .get('/observations')
    .expect(200);

    const expectedResponseBody = {
      '@context': [
        contextLinks.collection,
        contextLinks.observation
      ],
      '@id': `${apiBase}/observations`,
      '@type': [
        'Collection'
      ],
      member: [
        {
          '@id': '803-111-2020-03-09T10:17:37.000Z',
          '@type': 'Observation',
          resultTime: '2020-03-09T10:17:37.000Z',
          hasResult: {
            value: 78
          },
          madeBySensor: `${apiBase}/sensors/netatmo-02-00-00-3f-16-4c-humidity`,
          observedProperty: 'RelativeHumidity',
          hasFeatureOfInterest: 'EarthAtmosphere',
          inDeployment: [
            `${apiBase}/deployments/netatmo-gatekeepers`
          ],
          isHostedBy: [
            `${apiBase}/platforms/forestdale-primary-school`,
            `${apiBase}/platforms/netatmo-02-00-00-3f-16-4c-r4e`
          ],
          discipline: [
            'Meteorology'
          ],
          location: {
            id: '7164feea-d076-4ffa-8d48-c09643656f43',
            geometry: {
              type: 'Point',
              coordinates: [
                -2.004847526550293,
                52.4073600769043
              ]
            },
            validAt: '2020-02-13T20:30:32.007Z'
          },
          usedProcedure: [
            'PointSample'
          ]
        }
      ]
    };

    expect(response.body).toEqual(expectedResponseBody);
       
  });


});