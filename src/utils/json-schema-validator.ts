import Ajv from 'ajv';

export const validator = new Ajv({useDefaults: true});

// TODO: Is it actually easier to load all my schemas in here?
// The real benefit of this would be being able to link them to one another, see:
// https://www.npmjs.com/package/ajv#combining-schemas-with-ref
// For example if I want to reference the schema for a "location" object in a couple of different schemas.
// Make use of the $id property.