import express from 'express';
import {createCategoryIncome, getCategoryIncome,getOverAllcategory,
	getSingleVehicle,	getCategoryName,createHistory,
	getIncomeByTechnicianPersonName,getAllTechnician,getAllSaleperson,
	getIncomeBySalePersonName, getFixedPricebysalepersonName,
	updateCategoryIncome,deleteCategory,
	createIncome,getAllIncome, getAllIncomewithfilter,
	getIncomeByCategory, updateIncome, deleteIncome,updateExistingIncomes }
from '../../controllers/DailyIncome/dailyincomeController.js';

import { protectedRoute,isAdmin,isUser } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Route to create a new income entry (Admin or Salesperson only)
router.post('/create-Category',  createCategoryIncome);

router.get('/get-Category',  getCategoryIncome);

router.get('/get-Category/:name',  getCategoryName);

router.put('/update-Category/:id',  updateCategoryIncome);

router.delete('/delete-category/:id', deleteCategory)

// Route to create a new income entry (Admin or Salesperson only)
router.post('/create-income',  createIncome);

router.post('/create-History',  createHistory);

router.put("/update-existing-incomes", updateExistingIncomes);

// Route to get all income entries (Admin only)
router.get('/get-income-filter',  getAllIncomewithfilter);

router.get('/get-All-category', getOverAllcategory);

router.get('/get-income', getAllIncome);

// Route to get a specific income entry by ID (Admin only)
router.get('/get-single-income/:Category',  getIncomeByCategory);

// Route to get a specific income entry by ID (Admin only)
router.get('/get-single-Vehicle/:Vehicle',  getSingleVehicle);

router.get('/get-income-by-salesperson/:name',  getIncomeBySalePersonName);

router.get('/get-all-tech', getAllTechnician);

router.get('/get-all-Saleperson', getAllSaleperson);

router.get('/get-income-by-Technicianperson/:name',  getIncomeByTechnicianPersonName);

router.get('/get-Fixedprice-by-Salepersonperson/:name/:packageName',  getFixedPricebysalepersonName);

// Route to update a specific income entry by ID (Admin only)
router.put('/update-income/:id', updateIncome);

// Route to delete a specific income entry by ID (Admin only)
router.delete('/delete-income/:id',  deleteIncome);

export default router;
