import {config} from '../../config';

const apiBase = config.api.base;


//-------------------------------------------------
// Common Definitions
//-------------------------------------------------
const common = {
  uo: 'https://urbanobservatory.github.io/standards/vocabulary/latest/',
  buo: 'https://birminghamurbanobservatory.com/vocabulary/latest/',
  sosa: 'http://www.w3.org/ns/sosa/',
  ssn: 'http://www.w3.org/ns/ssn/'
};


//-------------------------------------------------
// Collection
//-------------------------------------------------
export function getCollectionContext(): object {
  const context = {
    uo: common.uo,
    Collection: 'uo:Collection',
    member: {
      '@id': 'uo:member',
    }
    // TODO: More to add
  };
  return context;
}


//-------------------------------------------------
// Deployment
//-------------------------------------------------
export function getDeploymentContext(): object {
  const context = {
    '@base': `${apiBase}/`,
    ssn: common.ssn,
    Deployment: 'ssn:Deployment'
  };
  return context;
}


//-------------------------------------------------
// Platform
//-------------------------------------------------
export function getPlatformContext(): object {
  const context = {
    '@base': `${apiBase}/`,
    sosa: common.sosa,
    Platform: 'sosa:Platform'
  };
  return context;
}


//-------------------------------------------------
// Permanent Host
//-------------------------------------------------
export function getPermanentHostContext(): object {
  const context = {
    '@base': `${apiBase}/`,
  };
  return context;
}


//-------------------------------------------------
// Unknown Sensor
//-------------------------------------------------
export function getUnknownSensorContext(): object {
  const context = {
    '@base': `${apiBase}/`,
  };
  return context;
}


//-------------------------------------------------
// Sensor
//-------------------------------------------------
export function getSensorContext(): object {
  const context = {
    '@base': `${apiBase}/`,
    sosa: common.sosa,
    Sensor: 'sosa:Sensor'
  };
  return context;
}


//-------------------------------------------------
// Observation
//-------------------------------------------------
export function getObservationContext(): object {
  const context = {
    '@base': `${apiBase}/`,
    sosa: common.sosa,
    ssn: common.ssn,
    buo: common.buo,
    Observation: 'sosa:Observation',
    madeBySensor: {
      '@id': 'sosa:madeBySensor',
      '@type': '@id',
      '@context': {
        // When I tried this in the json-ld playground as just "/sensors/"", it didn't added the correct first part of the url, so I'm specifically including it here.
        '@base': `${apiBase}/sensors/`
      }
    },
    resultTime: 'sosa:resultTime',
    hasResult: 'sosa:hasResult',
    observedProperty: 'sosa:ObservedProperty',
    hasFeatureOfInterest: {
      '@id': 'sosa:hasFeatureOfInterest',
      '@type': '@id'
    },
    usedProcedure: 'sosa:usedProcedure',
    ancestorPlatform: {
      '@id': 'buo:ancestorPlatform',
      '@type': '@id',
      '@context': {
        '@base': `${apiBase}/platforms/`
      }
    },
    inDeployment: {
      '@id': 'ssn:inDeployment',
      '@type': '@id',
      '@context': {
        '@base': `${apiBase}/deployments/`
      }
    },
    
  };
  return context;
}


//-------------------------------------------------
// Urban Observatory
//-------------------------------------------------
export function getUrbanObservatoryContext(): object {
  const context = {
    schema: 'https://schema.org/',
    name: 'schema:name',
    description: 'schema:description'
  };
  return context;
}