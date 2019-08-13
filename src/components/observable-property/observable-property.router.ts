//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {createObservableProperty, getObservableProperty, getObservableProperties} from './observable-property.controller';
import {asyncWrapper} from '../../utils/async-wrapper';
import {Unauthorized} from '../../errors/Unauthorized';
import {Forbidden} from '../../errors/Forbidden';
import {doesUserHavePermission} from '../../utils/permissions';
import * as joi from '@hapi/joi';
import {InvalidObservableProperty} from './errors/InvalidObservableProperty';

const router = express.Router();

export {router as ObservablePropertyRouter};


//-------------------------------------------------
// Create Observable Property
//-------------------------------------------------
const createObservablePropertyBodySchema = joi.object({
  id: joi.string()
    .required(),
  name: joi.string()
    .required(),
  unit: joi.string(),
  valueType: joi.string()
    .required()
})
.required();

router.post('/observable-properties', asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Observable property can not be created because your request has not provided any user credentials');
  }

  // Check this user have permission to do this
  const permission = 'create:observable-property';
  const hasPermission = await doesUserHavePermission(req.user.id, permission);
  if (!hasPermission) {
    throw new Forbidden(`You do not have permission (${permission}) to make this request.`);
  }
 
  // Let's catch an invalid observable property early, i.e. before calling the event stream.
  const {error: bodyErr, value: body} = joi.validate(req.body, createObservablePropertyBodySchema);
  if (bodyErr) throw new InvalidObservableProperty(bodyErr.message);    

  const createdDeployment = await createObservableProperty(body);
  return res.status(201).json(createdDeployment);

}));


//-------------------------------------------------
// Get Observable Property
//-------------------------------------------------
router.get('/observable-properties/:observablePropertyId', asyncWrapper(async (req, res): Promise<any> => {
  const observablePropertyId = req.params.observablePropertyId;
  const observableProperty = await getObservableProperty(observablePropertyId);
  return res.json(observableProperty);
}));


//-------------------------------------------------
// Get Observable Properties
//-------------------------------------------------
router.get('/observable-properties', asyncWrapper(async (req, res): Promise<any> => {
  const observableProperties = await getObservableProperties();
  return res.json(observableProperties);
}));