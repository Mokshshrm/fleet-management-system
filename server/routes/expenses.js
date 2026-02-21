import express from 'express';
import { authenticate, requireRole, requireRoles } from '../middleware/auth.js';
import * as expenseController from '../controllers/expenseController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  expenseController.getAllExpenses
);

router.get('/:id',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  expenseController.getExpenseById
);

router.post('/',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst'),
  expenseController.createExpense
);

router.patch('/:id',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst'),
  expenseController.updateExpense
);

router.delete('/:id',
  authenticate,
  requireRole('admin'),
  expenseController.deleteExpense
);

router.post('/:id/approve',
  authenticate,
  requireRole('admin'),
  expenseController.approveExpense
);

router.post('/:id/reject',
  authenticate,
  requireRole('admin'),
  expenseController.rejectExpense
);

router.get('/by-category',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  expenseController.getExpensesByCategory
);

router.get('/stats',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  expenseController.getExpenseStats
);

export default router;
