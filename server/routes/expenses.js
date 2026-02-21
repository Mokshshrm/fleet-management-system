import express from 'express';
import { authenticate, requireRole, requireRoles, requirePermission } from '../middleware/auth.js';
import { uploadExpenseReceipt, uploadExpenseDocuments, handleUploadError } from '../middleware/upload.js';
import * as expenseController from '../controllers/expenseController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requirePermission('VIEW_EXPENSES'),
  expenseController.getAllExpenses
);

router.get('/:id',
  authenticate,
  requirePermission('VIEW_EXPENSES'),
  expenseController.getExpenseById
);

router.post('/',
  authenticate,
  requirePermission('CREATE_EXPENSE'),
  expenseController.createExpense
);

router.patch('/:id',
  authenticate,
  requirePermission('UPDATE_EXPENSE'),
  expenseController.updateExpense
);

router.delete('/:id',
  authenticate,
  requirePermission('DELETE_EXPENSE'),
  expenseController.deleteExpense
);

router.post('/:id/approve',
  authenticate,
  requirePermission('UPDATE_EXPENSE'),
  expenseController.approveExpense
);

router.post('/:id/reject',
  authenticate,
  requirePermission('UPDATE_EXPENSE'),
  expenseController.rejectExpense
);

router.get('/by-category',
  authenticate,
  requirePermission('VIEW_EXPENSES'),
  expenseController.getExpensesByCategory
);

router.get('/stats',
  authenticate,
  requirePermission('VIEW_EXPENSES'),
  expenseController.getExpenseStats
);

export default router;
