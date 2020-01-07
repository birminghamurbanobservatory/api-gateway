import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {getPlatformLocations, formatPlatformLocationsForClient} from './platform-location.controller';

const router = express.Router();

export {router as PlatformLocationRouter};




//-------------------------------------------------
// Get a Platform's locations
//-------------------------------------------------
// TODO: Add filtering by a time window, and perhaps a spatial window.
router.get('/deployments/:deploymentId/platforms/:platformId/locations', asyncWrapper(async (req, res): Promise<any> => {

  const platformId = req.params.platformId;

  const locations = await getPlatformLocations({platformId});

  const locationsForClient = locations.map(formatPlatformLocationsForClient);
  return res.json(locationsForClient);

}));
