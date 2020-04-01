//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import * as path from 'path';
import * as Promise from 'bluebird';
import {readdir} from 'fs';
const readdirAsync = Promise.promisify(readdir);
import {concat, sortBy, replace} from 'lodash';
import {config} from '../config';
const apiBase = config.api.base;

const router = express.Router();

export {router as SchemaRouter};

// Handy docs:
// https://expressjs.com/en/starter/static-files.html
// https://expressjs.com/en/resources/middleware/serve-static.html

// N.B. in development mode we'll be coming out of src and going back into src. However in production mode, i.e. using the compiled .js files in dist/, we'll be coming out of dist and going into src. This saves us from figuring out how to copy over the json schema files into the dist directory.
const commonPartOfPath = '../../src/components/';

const schemaDirectoriesPartial = [
  'account/schemas',
  'common/schemas',
  'deployment/schemas',
  'observation/schemas',
  'permanent-host/schemas',
  'platform/schemas',
  'register/schemas',
  'root/schemas',
  'sensor/schemas',
  'unknown-sensor/schemas',
  'users/schemas',
];

const schemaDirectories = schemaDirectoriesPartial.map((partialPath): string => {
  return path.join(__dirname, `${commonPartOfPath}${partialPath}`);
});

// This file serve each json schema file at /schemas/json-file-name-here.json
schemaDirectories.forEach((schemaDir): any => {
  router.use(`/schemas`, express.static(schemaDir));
  // TODO: When a user clicks on a $ref, I want express to ignore the fact that it contains #hash/definitions/someProperty at the end. How to do this?
});


// Let's also get a list of all the json file names so we can serve them all in JSON file at the /schemas endpoint, for the sake of discoverability.
(async (): Promise<any> => {

  const schemafileNames = await getFileNames(schemaDirectories);
  const schemaFileNamesSorted = sortBy(schemafileNames);
  const schemaInfoArray = schemaFileNamesSorted.map((filename): any => {
    return {
      '@id': `${apiBase}/schemas/${filename}`,
      title: replace(filename, '.schema.json', '')
    };
  });

  router.get('/schemas', (req, res): any => {
    return res.json(schemaInfoArray);
  });

})();



async function getFileNames(schemaDirs): Promise<string[]> {

  return await Promise.reduce(schemaDirs, async (filenamesSoFar, schemaDir): Promise<string[]> => {
    const filesInThisDir = await readdirAsync(schemaDir);
    return concat(filenamesSoFar, filesInThisDir);
  }, []);

}