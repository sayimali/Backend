import express from 'express';
import {createCityIncome,getallcity
 }
from '../../controllers/DPC/dpc.js';

const router = express.Router();

router.post('/create-City',  createCityIncome);

router.get('/get-city', getallcity )

export default router;
