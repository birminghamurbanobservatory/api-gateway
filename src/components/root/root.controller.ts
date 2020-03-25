import {contextLinks} from '../context/context.service';
import {config} from '../../config'; 

export async function getRoot(): Promise<any> {

  return {
    '@context': [
      contextLinks.urbanObservatory
    ],
    '@id': `${config.api.base}`,
    name: 'Birmingham Urban Observatory API',
    description: 'The REST HTTPS API for the Birmingham Urban Observatory. The Birmingham Urban Observatory is a Phase 2 Observatory. This API primarily serves sensor data collected over the Birmingham area (Midlands, England). This sensor data is useful to a variety of disciplines (e.g. Meteorology, Atmospheric Chemistry, Transport, etc). The majority of the data is served in JSON-LD format.',
    siblings: [
      {
        '@id': 'https://api.urbanobservatory.ac.uk',
        name: 'Newcastle Urban Observatory API',
        decription: 'A Phase 1 Urban Observatory based in Newcastle (North East, England).'
      }
    ],
    collections: [
      {
        '@id': `${config.api.base}/deployments`,
        name: 'Deployments' 
      },
      {
        '@id': `${config.api.base}/platforms`,
        name: 'Platforms' 
      },
      {
        '@id': `${config.api.base}/sensors`,
        name: 'Sensors' 
      },
      {
        '@id': `${config.api.base}/observations`,
        name: 'Observations' 
      },
    ]
  };

}