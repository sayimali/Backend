import express from 'express';
import jwt from 'jsonwebtoken';
import {
  registerUser,
  loginUser,
  getUsers,
  getCurrentUser,
  updateUser,
  deleteUser,
  logoutUser,
  testController,
} from '../controllers/authController.js';

import { protectedRoute,isAdmin,isUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register',registerUser);

router.post('/login', loginUser);

router.get('/all-users',getUsers,);

router.get('/single-user/:id', protectedRoute, (req, res, next) => {
  // Admin ya user khud access kar sake
  if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
}, getCurrentUser);

router.put('/update-user/:id',  updateUser);

router.delete('/delete-user/:id',  deleteUser);

router.post('/logout',  logoutUser);

// Test route (optional: make protected if needed)
router.get('/test', testController);


export default router;
