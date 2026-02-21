import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as vehicleController from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/',
  authenticate,
  vehicleController.getAllVehicles
);

router.get('/available',
  authenticate,
  vehicleController.getAvailableVehicles
);

router.get('/:id',
  authenticate,
  vehicleController.getVehicleById
);

router.post('/',
  authenticate,
  requireRole('fleet_manager'),
  vehicleController.createVehicle
);

router.patch('/:id',
  authenticate,
  requireRole('fleet_manager'),
  vehicleController.updateVehicle
);

router.delete('/:id',
  authenticate,
  requireRole('admin'),
  vehicleController.deleteVehicle
);

router.get('/:id/trips',
  authenticate,
  vehicleController.getVehicleTrips
);

router.get('/:id/maintenance',
  authenticate,
  vehicleController.getVehicleMaintenance
);

router.get('/:id/expenses',
  authenticate,
  vehicleController.getVehicleExpenses
);

router.get('/:id/stats',
  authenticate,
  vehicleController.getVehicleStats
);

export default router;
