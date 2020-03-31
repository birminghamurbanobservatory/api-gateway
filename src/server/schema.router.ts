//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import * as path from 'path';


const router = express.Router();

export {router as SchemaRouter};

// Handy docs:
// https://expressjs.com/en/starter/static-files.html
// https://expressjs.com/en/resources/middleware/serve-static.html

router.use('/schemas', express.static(path.join(__dirname, '../components/deployment/schemas')));
router.use('/schemas', express.static(path.join(__dirname, '../components/platform/schemas')));