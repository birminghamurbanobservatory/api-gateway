import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {getObservationContext, getCollectionContext, getUnknownSensorContext, getDeploymentContext, getPlatformContext, getSensorContext, getUrbanObservatoryContext, getTimeseriesContext, getProcedureContext, getDisciplineContext, getUnitContext, getFeatureOfInterestContext, getAggregationContext, getObservablePropertyContext} from './context.controller';

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


router.get('/context/urban-observatory.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getUrbanObservatoryContext();
  return res.json(context);
}));


router.get('/context/timeseries.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getTimeseriesContext();
  return res.json(context);
}));

router.get('/context/procedure.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getProcedureContext();
  return res.json(context);
}));

router.get('/context/discipline.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getDisciplineContext();
  return res.json(context);
}));

router.get('/context/unit.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getUnitContext();
  return res.json(context);
}));

router.get('/context/feature-of-interest.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getFeatureOfInterestContext();
  return res.json(context);
}));

router.get('/context/observable-property.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getObservablePropertyContext();
  return res.json(context);
}));

router.get('/context/aggregation.jsonld', asyncWrapper(async (req, res): Promise<any> => {
  const context = getAggregationContext();
  return res.json(context);
}));
