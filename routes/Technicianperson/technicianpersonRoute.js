import express from 'express';
import { createTechnician, getAllTechnicians, getTechniciansByName, updateTechnician, deleteTechnician }
from '../../controllers/TechnicianPerson/technicianpersonController.js';


const router = express.Router();

// Route to create a new income entry (Admin or techniciansperson only)
router.post('/create-technician',  createTechnician );

// Route to get all income entries (Admin only)
router.get('/get-technician',  getAllTechnicians);

// Route to get a specific income entry by ID (Admin only)

router.get('/technician/name/:name', getTechniciansByName);



// Route to update a specific income entry by ID (Admin only)
router.put('/update-technician/:id',  updateTechnician);

// Route to delete a specific income entry by ID (Admin only)
router.delete('/delete-technician/:id', deleteTechnician);

export default router;
