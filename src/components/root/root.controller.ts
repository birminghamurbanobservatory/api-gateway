import {contextLinks} from '../context/context.service';
import {config} from '../../config'; 

export async function getRoot(): Promise<any> {

  return {
    '@context': [
      contextLinks.urbanObservatory
    ],
    '@id': `${config.api.base}`,
    label: 'Birmingham Urban Observatory API',
    description: 'The REST HTTPS API for the Birmingham Urban Observatory. The Birmingham Urban Observatory is a Phase 2 Observatory. This API primarily serves sensor data collected over the Birmingham area (Midlands, England). This sensor data is useful to a variety of disciplines (e.g. Meteorology, Atmospheric Chemistry, Transport, etc). The majority of the data is served in JSON-LD format.',
    documentation: 'https://stoplight.io/p/docs/gh/birminghamurbanobservatory/docs',
    siblings: [
      {
        '@id': 'https://api.urbanobservatory.ac.uk',
        label: 'Newcastle Urban Observatory API',
        decription: 'A Phase 1 Urban Observatory based in Newcastle (North East, England).'
      }
    ],
    collections: [
      {
        '@id': `${config.api.base}/deployments`,
        label: 'Deployments' 
      },
      {
        '@id': `${config.api.base}/platforms`,
        label: 'Platforms' 
      },
      {
        '@id': `${config.api.base}/sensors`,
        label: 'Sensors' 
      },
      {
        '@id': `${config.api.base}/observations`,
        label: 'Observations' 
      },
      {
        '@id': `${config.api.base}/timeseries`,
        label: 'Timeseries' 
      },
      {
        '@id': `${config.api.base}/disciplines`,
        label: 'Disciplines' 
      },
      {
        '@id': `${config.api.base}/observable-properties`,
        label: 'Observable Properties' 
      },
      {
        '@id': `${config.api.base}/aggregations`,
        label: 'Aggregations' 
      },
      {
        '@id': `${config.api.base}/units`,
        label: 'Units' 
      },
      {
        '@id': `${config.api.base}/features-of-interest`,
        label: 'Features of Interest' 
      },
      {
        '@id': `${config.api.base}/procedures`,
        label: 'Procedures' 
      },
    ]
  };

}