import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getObservationContext, getCollectionContext} from './context.controller';

const router = express.Router();  

export {router as ContextRouter};


router.get('/context/collection.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getCollectionContext();
  return res.json(context);
}));


router.get('/context/observation.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getObservationContext();
  return res.json(context);
}));