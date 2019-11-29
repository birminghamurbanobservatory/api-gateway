//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {createFeatureOfInterest, getFeatureOfInterest, getFeaturesOfInterest} from './feature-of-interest.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
import {Unauthorized} from '../../errors/Unauthorized';
import {Forbidden} from '../../errors/Forbidden';
import * as joi from '@hapi/joi';
import {InvalidFeatureOfInterest} from './errors/InvalidFeatureOfInterest';
import {permissionsCheck} from '../../routes/middleware/permissions';

const router = express.Router();

export {router as FeatureOfInterestRouter};


//-------------------------------------------------
// Create Feature Of Interest
//-------------------------------------------------
const createFeatureOfInterestBodySchema = joi.object({
  id: joi.string()
    .required(),
  name: joi.string()
    .required()
})
.required();

router.post('/features-of-interest', permissionsCheck('create:feature-of-interest'), asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Observable property can not be created because your request has not provided any user credentials');
  }
 
  // Let's catch an invalid feature of interest early, i.e. before calling the event stream.
  const {error: bodyErr, value: body} = createFeatureOfInterestBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidFeatureOfInterest(bodyErr.message);    

  const createdDeployment = await createFeatureOfInterest(body);
  return res.status(201).json(createdDeployment);

}));


//-------------------------------------------------
// Get Feature Of Interest
//-------------------------------------------------
router.get('/features-of-interest/:featureOfInterestId', asyncWrapper(async (req, res): Promise<any> => {
  const featureOfInterestId = req.params.featureOfInterestId;
  const featureOfInterest = await getFeatureOfInterest(featureOfInterestId);
  return res.json(featureOfInterest);
}));


//-------------------------------------------------
// Get Feature Of Interest
//-------------------------------------------------
router.get('/features-of-interest', asyncWrapper(async (req, res): Promise<any> => {
  const featuresOfInterest = await getFeaturesOfInterest();
  return res.json(featuresOfInterest);
}));
