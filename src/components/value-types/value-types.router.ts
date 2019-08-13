//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getValueTypes} from './value-types.controller';


const router = express.Router();

export {router as ValueTypeRouter};



//-------------------------------------------------
// Get Value Types
//-------------------------------------------------
router.get('/value-types', asyncWrapper(async (req, res): Promise<any> => {
  const valueTypes = await getValueTypes();
  return res.json(valueTypes);
}));
