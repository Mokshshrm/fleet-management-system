import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as fuelController from '../controllers/fuelController.js';

const router = express.Router();

router.get('/',
  authenticate,
  fuelController.getAllFuelLogs
);

router.get('/:id',
  authenticate,
  fuelController.getFuelLogById
);

router.post('/',
  authenticate,
  fuelController.createFuelLog
);

router.patch('/:id',
  authenticate,
  requireRole('fleet_manager'),
  fuelController.updateFuelLog
);

router.delete('/:id',
  authenticate,
  requireRole('admin'),
  fuelController.deleteFuelLog
);

router.get('/vehicle/:vehicleId/stats',
  authenticate,
  fuelController.getVehicleFuelStats
);

router.get('/reports/efficiency',
  authenticate,
  fuelController.getFuelEfficiencyReport
);

export default router;
