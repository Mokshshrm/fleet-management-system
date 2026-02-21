import express from 'express';
import { authenticate, requireRole, requireRoles } from '../middleware/auth.js';
import * as driverController from '../controllers/driverController.js';

const router = express.Router();

router.get('/',
  authenticate,
  driverController.getAllDrivers
);

router.get('/available',
  authenticate,
  driverController.getAvailableDrivers
);

router.get('/:id',
  authenticate,
  driverController.getDriverById
);

router.post('/',
  authenticate,
  requireRole('fleet_manager'),
  driverController.createDriver
);

router.patch('/:id',
  authenticate,
  requireRoles('fleet_manager', 'safety_officer'),
  driverController.updateDriver
);

router.delete('/:id',
  authenticate,
  requireRole('admin'),
  driverController.deleteDriver
);

router.get('/:id/trips',
  authenticate,
  driverController.getDriverTrips
);

router.get('/:id/performance',
  authenticate,
  driverController.getDriverPerformance
);

router.patch('/:id/safety-score',
  authenticate,
  requireRole('safety_officer'),
  driverController.updateDriverSafetyScore
);

router.post('/:id/incidents',
  authenticate,
  requireRole('safety_officer'),
  driverController.addDriverIncident
);

router.patch('/:id/status',
  authenticate,
  requireRole('fleet_manager'),
  driverController.updateDriverStatus
);

export default router;
