import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requireRole('admin'),
  userController.getAllUsers
);

router.get('/me',
  authenticate,
  userController.getCurrentUser
);

router.get('/:id',
  authenticate,
  requireRole('admin'),
  userController.getUserById
);

router.patch('/:id',
  authenticate,
  requireRole('admin'),
  userController.updateUser
);

router.patch('/:id/role',
  authenticate,
  requireRole('owner'),
  userController.updateUserRole
);

router.patch('/:id/status',
  authenticate,
  requireRole('admin'),
  userController.toggleUserStatus
);

router.delete('/:id',
  authenticate,
  requireRole('owner'),
  userController.deleteUser
);

export default router;
