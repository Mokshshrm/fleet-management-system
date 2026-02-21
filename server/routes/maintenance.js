import express from 'express';
import { authenticate, requireRole, requireRoles, requirePermission } from '../middleware/auth.js';
import * as maintenanceController from '../controllers/maintenanceController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requirePermission('VIEW_MAINTENANCE'),
  maintenanceController.getAllMaintenanceLogs
);

router.get('/:id',
  authenticate,
  requirePermission('VIEW_MAINTENANCE'),
  maintenanceController.getMaintenanceById
);

router.post('/',
  authenticate,
  requirePermission('CREATE_MAINTENANCE'),
  maintenanceController.createMaintenanceLog
);

router.patch('/:id',
  authenticate,
  requirePermission('UPDATE_MAINTENANCE'),
  maintenanceController.updateMaintenanceLog
);

router.delete('/:id',
  authenticate,
  requirePermission('DELETE_MAINTENANCE'),
  maintenanceController.deleteMaintenanceLog
);

router.post('/:id/start',
  authenticate,
  requireRoles('fleet_manager', 'safety_officer'),
  maintenanceController.startMaintenance
);

router.post('/:id/complete',
  authenticate,
  requireRoles('fleet_manager', 'safety_officer'),
  maintenanceController.completeMaintenance
);

router.post('/:id/cancel',
  authenticate,
  requireRoles('fleet_manager', 'safety_officer'),
  maintenanceController.cancelMaintenance
);

router.get('/stats',
  authenticate,
  maintenanceController.getMaintenanceStats
);

export default router;
