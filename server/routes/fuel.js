import express from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';
import { uploadFuelReceipt, handleUploadError } from '../middleware/upload.js';
import * as fuelController from '../controllers/fuelController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requirePermission('VIEW_FUEL'),
  fuelController.getAllFuelLogs
);

router.get('/:id',
  authenticate,
  requirePermission('VIEW_FUEL'),
  fuelController.getFuelLogById
);

router.post('/',
  authenticate,
  requirePermission('CREATE_FUEL'),
  uploadFuelReceipt,
  handleUploadError,
  fuelController.createFuelLog
);

router.patch('/:id',
  authenticate,
  requirePermission('UPDATE_FUEL'),
  uploadFuelReceipt,
  handleUploadError,
  fuelController.updateFuelLog
);

router.delete('/:id',
  authenticate,
  requirePermission('DELETE_FUEL'),
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
