import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getObservationContext, getCollectionContext, getUnknownSensorContext, getDeploymentContext, getPlatformContext, getSensorContext, getUrbanObservatoryContext} from './context.controller';

const router = express.Router();  

export {router as ContextRouter};


router.get('/context/collection.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getCollectionContext();
  res.set('Content-Type', 'application/ld+json');
  return res.json(context);
}));


router.get('/context/observation.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getObservationContext();
  res.set('Content-Type', 'application/ld+json');
  return res.json(context);
}));


router.get('/context/unknown-sensor.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getUnknownSensorContext();
  res.set('Content-Type', 'application/ld+json');
  return res.json(context);
}));


router.get('/context/deployment.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getDeploymentContext();
  res.set('Content-Type', 'application/ld+json');
  return res.json(context);
}));


router.get('/context/platform.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getPlatformContext();
  res.set('Content-Type', 'application/ld+json');
  return res.json(context);
}));


router.get('/context/sensor.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getSensorContext();
  res.set('Content-Type', 'application/ld+json');
  return res.json(context);
}));


router.get('/context/urban-observatory.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getUrbanObservatoryContext();
  res.set('Content-Type', 'application/ld+json');
  return res.json(context);
}));