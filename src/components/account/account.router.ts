//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';


const router = express.Router();

export {router as AccountRouter};


//-------------------------------------------------
// Get users permissions
//-------------------------------------------------
router.get('/account/permissions', asyncWrapper(async (req, res): Promise<any> => {
  const permissions = req.user.permissions;
  return res.json(permissions);
}));
