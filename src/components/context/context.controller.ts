
//-------------------------------------------------
// Common Definitions
//-------------------------------------------------
const common = {
  uo: 'https://urbanobservatory.github.io/standards/vocabulary/latest/',
  sosa: 'http://www.w3.org/ns/sosa/'
};


//-------------------------------------------------
// Collection
//-------------------------------------------------
export function getCollectionContext(): object {
  const context = {
    uo: common.uo,
    Collection: 'uo:Collection',
    member: {
      '@id': 'uo:hasMember',
      '@container': '@id',
    }
    // TODO: More to add
  };
  return context;
}


//-------------------------------------------------
// Observation
//-------------------------------------------------
export function getObservationContext(): object {
  const context = {
    sosa: common.sosa,
    Observation: 'sosa:Observation',
    madeBySensor: {
      '@id': 'sosa:madeBySensor',
      '@type': '@id'
    },
    resultTime: 'sosa:resultTime',
    hasResult: 'sosa:hasResult',
    observedProperty: 'sosa:ObservedProperty',
    hasFeatureOfInterest: {
      '@id': 'sosa:hasFeatureOfInterest',
      '@type': '@id'
    },
    usedProcedure: 'sosa:usedProcedure'
    // TODO: More to add
  };
  return context;
}