import express from 'express';
import { authenticate, requireRole, requireRoles } from '../middleware/auth.js';
import * as maintenanceController from '../controllers/maintenanceController.js';

const router = express.Router();

router.get('/',
  authenticate,
  maintenanceController.getAllMaintenanceLogs
);

router.get('/:id',
  authenticate,
  maintenanceController.getMaintenanceById
);

router.post('/',
  authenticate,
  requireRoles('fleet_manager', 'safety_officer'),
  maintenanceController.createMaintenanceLog
);

router.patch('/:id',
  authenticate,
  requireRoles('fleet_manager', 'safety_officer'),
  maintenanceController.updateMaintenanceLog
);

router.delete('/:id',
  authenticate,
  requireRole('admin'),
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
