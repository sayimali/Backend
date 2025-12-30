
import express from 'express';
import { createPackageIncome, getallpackage
 }
from '../../controllers/DPC/dpc.js';

const router = express.Router();

router.post('/create-Package',  createPackageIncome);

router.get('/get-package', getallpackage);



export default router;
