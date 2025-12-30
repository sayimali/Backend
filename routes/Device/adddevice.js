
import express from 'express';
import {createDeviceIncome,getalldevice
 }
from '../../controllers/DPC/dpc.js';


const router = express.Router();


router.post('/create-Device',  createDeviceIncome);

router.get('/get-device', getalldevice)

export default router;
