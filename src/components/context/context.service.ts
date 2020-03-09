import {config} from '../../config';

const apiBase = config.api.base;
const ext = '.jsonld';

export const contextLinks = {
  collection: `${apiBase}/context/collection${ext}`,
  observation: `${apiBase}/context/observation${ext}`
};