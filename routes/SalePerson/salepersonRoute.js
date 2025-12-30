import express from 'express';
import { createSale, getAllSales, getSalesByNameAndPackage, updateSale, deleteSale }
from '../../controllers/SalePerson/salepersonController.js';


const router = express.Router();

// Route to create a new income entry (Admin or Salesperson only)
router.post('/create-sale',  createSale);

// Route to get all income entries (Admin only)
router.get('/get-sale',  getAllSales);

// Route to get a specific income entry by ID (Admin only)
router.get('/get-sales-by-name-and-package', getSalesByNameAndPackage);

// Route to update a specific income entry by ID (Admin only)
router.put('/update-sale/:id',  updateSale);

// Route to delete a specific income entry by ID (Admin only)
router.delete('/delete-sale/:id',  deleteSale);

export default router;
