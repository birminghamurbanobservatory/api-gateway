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
  let permissions;
  if (req.user && req.user.permissions) {
    permissions = req.user.permissions;
  } else {
    permissions = [];
  }
  return res.json(permissions);
}));
