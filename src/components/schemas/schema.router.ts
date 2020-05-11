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


// This serves each json schema file at /schemas/json-file-name-here.json
router.use(`/schemas`, express.static(schemaDirectory));


// Let's also get a list of all the json file names so we can serve them all in JSON file at the /schemas endpoint, for the sake of discoverability.
(async (): Promise<any> => {

  const schemaFilenames = await readdirAsync(schemaDirectory);
  const filteredFilenames = schemaFilenames.filter((name): boolean => name.endsWith('.json'));
  const schemaFileNamesSorted = sortBy(filteredFilenames);
  const schemaInfoArray = schemaFileNamesSorted.map((filename): any => {
    const title = filename.replace('.json', '');
    return {
      '@id': `${apiBase}/schemas/${filename}`,
      title
    };
  });

  router.get('/schemas', (req, res): any => {
    return res.json(schemaInfoArray);
  });

})();



