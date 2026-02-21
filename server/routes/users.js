import express from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requirePermission('VIEW_USERS'),
  userController.getAllUsers
);

router.get('/me',
  authenticate,
  userController.getCurrentUser
);

router.get('/:id',
  authenticate,
  requirePermission('VIEW_USERS'),
  userController.getUserById
);

router.patch('/:id',
  authenticate,
  requirePermission('UPDATE_USER'),
  userController.updateUser
);

router.patch('/:id/role',
  authenticate,
  requireRole('owner'),
  userController.updateUserRole
);

router.patch('/:id/status',
  authenticate,
  requirePermission('UPDATE_USER'),
  userController.toggleUserStatus
);

router.delete('/:id',
  authenticate,
  requirePermission('DELETE_USER'),
  userController.deleteUser
);

export default router;
