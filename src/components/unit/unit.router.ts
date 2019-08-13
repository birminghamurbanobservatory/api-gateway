//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as check from 'check-types';
import {Unauthorized} from '../../errors/Unauthorized';
import {createUnit, getUnit, getUnits} from './unit.controller';
import {Forbidden} from '../../errors/Forbidden';
import {doesUserHavePermission} from '../../utils/permissions';
import {InvalidUnit} from './errors/InvalidUnit';

const router = express.Router();

export {router as UnitRouter};


//-------------------------------------------------
// Create Unit
//-------------------------------------------------
const createUnitBodySchema = joi.object({
  id: joi.string()
    .required(),
  shortName: joi.string()
})
.required();

router.post('/units', asyncWrapper(async (req, res): Promise<any> => {

  if (!req.user.id) {
    throw new Unauthorized('Unit can not be created because your request has not provided any user credentials');
  }

  // Does this user have permission to do this
  const permission = 'create:unit';
  const hasPermission = await doesUserHavePermission(req.user.id, permission);
  if (!hasPermission) {
    throw new Forbidden(`You do not have permission (${permission}) to make this request.`);
  }

  // Let's catch an invalid unit early, i.e. before calling the event stream.
  const {error: bodyErr, value: body} = joi.validate(req.body, createUnitBodySchema);
  if (bodyErr) throw new InvalidUnit(bodyErr.message);  

  const createdUnit = await createUnit(body);
  return res.status(201).json(createdUnit);

}));


//-------------------------------------------------
// Get Unit
//-------------------------------------------------
router.get('/units/:unitId', asyncWrapper(async (req, res): Promise<any> => {
  const unitId = req.params.unitId;
  const unit = await getUnit(unitId);
  return res.json(unit);
}));



//-------------------------------------------------
// Get Units
//-------------------------------------------------
router.get('/units', asyncWrapper(async (req, res): Promise<any> => {
  const units = await getUnits();
  return res.json(units);
}));
