import express from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';
import * as vehicleController from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requirePermission('VIEW_VEHICLES'),
  vehicleController.getAllVehicles
);

router.get('/available',
  authenticate,
  requirePermission('VIEW_VEHICLES'),
  vehicleController.getAvailableVehicles
);

router.get('/:id',
  authenticate,
  requirePermission('VIEW_VEHICLES'),
  vehicleController.getVehicleById
);

router.post('/',
  authenticate,
  requirePermission('CREATE_VEHICLE'),
  vehicleController.createVehicle
);

router.patch('/:id',
  authenticate,
  requirePermission('UPDATE_VEHICLE'),
  vehicleController.updateVehicle
);

router.delete('/:id',
  authenticate,
  requirePermission('DELETE_VEHICLE'),
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
