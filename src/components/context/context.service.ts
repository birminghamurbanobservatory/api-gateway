import {config} from '../../config';

const apiBase = config.api.base;
const ext = '.jsonld';

export const contextLinks = {
  collection: `${apiBase}/context/collection${ext}`,
  observation: `${apiBase}/context/observation${ext}`,
  unknownSensor: `${apiBase}/context/unknown-sensor${ext}`,
  deployment: `${apiBase}/context/deployment${ext}`,
  platform: `${apiBase}/context/platform${ext}`,
  sensor: `${apiBase}/context/sensor${ext}`,
  permanentHost: `${apiBase}/context/permanent-host${ext}`,
  urbanObservatory: `${apiBase}/context/urban-observatory${ext}`,
  timeseries: `${apiBase}/context/timeseries${ext}`,
  discipline: `${apiBase}/context/discipline${ext}`,
  unit: `${apiBase}/context/discipline${ext}`,
  observableProperty: `${apiBase}/context/observable-property${ext}`,
  usedProcedure: `${apiBase}/context/used-procedure${ext}`,
  featureOfInterest: `${apiBase}/context/feature-of-interest${ext}`,
};