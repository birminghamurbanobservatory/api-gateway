//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getUrbanObsVocabTidied} from './vocab.service';
import {config} from '../../config';
import * as path from 'path';

const router = express.Router();

export {router as VocabRouter};


//-------------------------------------------------
// Render UO vocab
//-------------------------------------------------
router.get('/vocab/uo', asyncWrapper(async (req, res): Promise<any> => {

  const vocab = await getUrbanObsVocabTidied();
  vocab.source = config.api.uoVocab;

  // This is a bit of cheat to save me having to copy over the .ejs file into the dist directory.
  const pagePath = path.join(__dirname, '../../../src/components/vocab/pages/uo-vocab.ejs');

  // need this because I added a global default of JSON-LD which I now need to overwrite
  res.set('Content-Type', 'text/html'); 
  return res.render(pagePath, vocab);

}));