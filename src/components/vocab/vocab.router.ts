//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getUrbanObsVocabTidied} from './vocab.service';
import {config} from '../../config';

const router = express.Router();

export {router as VocabRouter};


//-------------------------------------------------
// Render UO vocab
//-------------------------------------------------
router.get('/vocab/uo', asyncWrapper(async (req, res): Promise<any> => {

  const vocab = await getUrbanObsVocabTidied();
  vocab.source = config.api.uoVocab;

  return res.render(`${__dirname}/pages/uo-vocab.ejs`, vocab);

}));