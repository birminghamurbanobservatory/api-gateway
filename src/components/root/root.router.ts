//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {getRoot} from './root.controller';
import {asyncWrapper} from '../../utils/async-wrapper';

const router = express.Router();

export {router as RootRouter};


//-------------------------------------------------
// Get
//-------------------------------------------------
router.get('/', asyncWrapper(async (req, res): Promise<any> => {
  const jsonResponse = await getRoot();
  return res.send(jsonResponse);
}));