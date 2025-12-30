import express from 'express';
import {createAccountTitleIncome,getallaccountTitleincome,
	createAccountNumberIncome,
	getallaccountNumberincome,
 }
from '../../controllers/AccountTitleIncome/accounttitleincome.js';

const router = express.Router();

router.post('/create-Account-Title-Income',  createAccountTitleIncome );

router.get('/get-Account-Title-Income', getallaccountTitleincome );


router.post('/create-Account-Number-Income',  createAccountNumberIncome );

router.get('/get-Account-Number-Income', getallaccountNumberincome );


export default router;
