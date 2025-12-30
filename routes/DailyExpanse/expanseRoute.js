import express from 'express';
import { createCategoryExpanse,getCategoryExpanse,getCategoryName, updateCategoryExpanse,deleteCategory,
	 createExpanse, getAllExpanse, getExpanseByCategory, updateExpanse, deleteExpanse,getAllExpansewithfilter }
from '../../controllers/DailyExpanse/dailyexpanseController.js';

const router = express.Router();

// Route to create a new income entry (Admin or Salesperson only)
router.post('/create-Category',  createCategoryExpanse);

router.get('/get-Category',  getCategoryExpanse);

router.get('/get-Category/:name',  getCategoryName);

router.put('/update-Category/:id',  updateCategoryExpanse);

router.delete('/delete-category/:id', deleteCategory)

//create expanse
router.post('/create-expanse',  createExpanse);

router.get('/get-Expanse-filter',  getAllExpansewithfilter);
// Route to get all income entries (Admin only)
router.get('/get-Expanse',  getAllExpanse);

// Route to get a specific income entry by ID (Admin only)
router.get('/get-single-Expanse/:Category', getExpanseByCategory);

// Route to update a specific income entry by ID (Admin only)
router.put('/update-Expanse/:id',  updateExpanse);

// Route to delete a specific income entry by ID (Admin only)
router.delete('/delete-Expanse/:id', deleteExpanse);

export default router;
