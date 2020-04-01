//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import * as path from 'path';
import * as Promise from 'bluebird';
import {readdir} from 'fs';
const readdirAsync = Promise.promisify(readdir);
import {concat, sortBy, replace} from 'lodash';
import {config} from '../../config';
const apiBase = config.api.base;

const router = express.Router();

export {router as SchemaRouter};

// Handy docs:
// https://expressjs.com/en/starter/static-files.html
// https://expressjs.com/en/resources/middleware/serve-static.html

// N.B. in development mode we'll be coming out of src and going back into src. However in production mode, i.e. using the compiled .js files in dist/, we'll be coming out of dist and going into src. This saves us from figuring out how to copy over the json schema files into the dist directory.
const schemaDirectory = path.join(__dirname, '../../../src/components/schemas/json-schemas');


// TODO: When a user clicks on a $ref, I want express to ignore the fact that it contains #hash/definitions/someProperty at the end. How to do this? Some middleware perhaps?
function accountForDefinitions(req, res, next): any {
  console.log(req.url);
  return next();
}

// This serves each json schema file at /schemas/json-file-name-here.json
router.use(`/schemas`, accountForDefinitions, express.static(schemaDirectory));



// Let's also get a list of all the json file names so we can serve them all in JSON file at the /schemas endpoint, for the sake of discoverability.
(async (): Promise<any> => {

  const schemafileNames = await readdirAsync(schemaDirectory);
  const schemaFileNamesSorted = sortBy(schemafileNames);
  const schemaInfoArray = schemaFileNamesSorted.map((filename): any => {
    return {
      '@id': `${apiBase}/schemas/${filename}`,
      title: filename
    };
  });

  router.get('/schemas', (req, res): any => {
    return res.json(schemaInfoArray);
  });

})();



