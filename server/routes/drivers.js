import express from 'express';
import { authenticate, requireRole, requireRoles, requirePermission } from '../middleware/auth.js';
import * as driverController from '../controllers/driverController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requirePermission('VIEW_DRIVERS'),
  driverController.getAllDrivers
);

router.get('/available',
  authenticate,
  requirePermission('VIEW_DRIVERS'),
  driverController.getAvailableDrivers
);

router.get('/:id',
  authenticate,
  requirePermission('VIEW_DRIVERS'),
  driverController.getDriverById
);

router.post('/',
  authenticate,
  requirePermission('CREATE_DRIVER'),
  driverController.createDriver
);

router.patch('/:id',
  authenticate,
  requirePermission('UPDATE_DRIVER'),
  driverController.updateDriver
);

router.delete('/:id',
  authenticate,
  requirePermission('DELETE_DRIVER'),
  driverController.deleteDriver
);

router.get('/:id/trips',
  authenticate,
  requirePermission('VIEW_TRIPS'),
  driverController.getDriverTrips
);

router.get('/:id/performance',
  authenticate,
  requirePermission('VIEW_DRIVER_PERFORMANCE'),
  driverController.getDriverPerformance
);

router.patch('/:id/safety-score',
  authenticate,
  requirePermission('UPDATE_DRIVER_SAFETY'),
  driverController.updateDriverSafetyScore
);

router.post('/:id/incidents',
  authenticate,
  requirePermission('UPDATE_DRIVER_SAFETY'),
  driverController.addDriverIncident
);

router.patch('/:id/status',
  authenticate,
  requireRole('fleet_manager'),
  driverController.updateDriverStatus
);

export default router;
