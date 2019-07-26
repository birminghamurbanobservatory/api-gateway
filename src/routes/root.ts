//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
const router = express.Router();

export {router as RootRouter};

//-------------------------------------------------
// Get
//-------------------------------------------------
router.get('/', (req, res) => {
  return res.send('Welcome to the API Gateway.');
});