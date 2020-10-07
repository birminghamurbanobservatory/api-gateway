//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import * as joi from '@hapi/joi';

//-------------------------------------------------
// Validation Schema
//-------------------------------------------------
const schema = joi.object({
  // To get these details
  // Log in to Auth0
  // Go to applications
  // View/create a machine to machine application
  // View its settings
  AUTH0_MANAGEMENT_CLIENT_ID: joi.string()
    .required(),
  AUTH0_MANAGEMENT_CLIENT_SECRET: joi.string()
    .required(),
  AUTH0_MANAGEMENT_DOMAIN: joi.string()
    .required()    
}).unknown() // allows for extra fields (i.e that we don't check for) in the object being checked.
  .required();


//-------------------------------------------------
// Validate
//-------------------------------------------------
// i.e. check that process.env contains all the environmental variables we expect/need.
// It's important to use the 'value' that joi.validate spits out from now on, as joi has the power to do type conversion and add defaults, etc, and thus it may be different from the original process.env. 
const {error: err, value: envVars} = schema.validate(process.env);

if (err) {
  throw new Error(`An error occured whilst validating process.env: ${err.message}`);
}


//-------------------------------------------------
// Create config object
//-------------------------------------------------
// Pull out the properties we need to create this particular config object. 
export const auth0Management = {
  clientId: envVars.AUTH0_MANAGEMENT_CLIENT_ID,
  clientSecret: envVars.AUTH0_MANAGEMENT_CLIENT_SECRET,
  domain: envVars.AUTH0_MANAGEMENT_DOMAIN,
};