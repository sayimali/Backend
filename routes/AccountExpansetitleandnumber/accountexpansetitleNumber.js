import express from 'express';
	import {
		createAccountExpanseTitle,
		getallaccountexpanseTitle,
		createNumberExpanseNumber,
		getallNumberexpanseNumber
 }
from '../../controllers/AccountexpanseTitleandNumber/accountexpansetitleandnumber.js';

const router = express.Router();

router.post('/create-Account-Title-Expanse',  createAccountExpanseTitle);

router.get('/get-Account-Title-Expanse', getallaccountexpanseTitle );

router.post('/create-Expanse-Number',  createNumberExpanseNumber);

router.get('/get-Expanse-Number', getallNumberexpanseNumber )

export default router;
