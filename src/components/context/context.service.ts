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
  permanentHost: `${apiBase}/context/permanent-host${ext}`
};