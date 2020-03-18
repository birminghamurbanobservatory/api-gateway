import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getObservationContext, getCollectionContext, getUnknownSensorContext, getDeploymentContext, getPlatformContext, getSensorContext} from './context.controller';

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


router.get('/context/unknown-sensor.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getUnknownSensorContext();
  return res.json(context);
}));


router.get('/context/deployment.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getDeploymentContext();
  return res.json(context);
}));


router.get('/context/platform.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getPlatformContext();
  return res.json(context);
}));


router.get('/context/sensor.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getSensorContext();
  return res.json(context);
}));