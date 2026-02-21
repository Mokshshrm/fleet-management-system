import express from 'express';
import { authenticate, requireRole, requireRoles, requirePermission } from '../middleware/auth.js';
import * as tripController from '../controllers/tripController.js';

const router = express.Router();

router.get('/',
  authenticate,
  requirePermission('VIEW_TRIPS'),
  tripController.getAllTrips
);

router.get('/:id',
  authenticate,
  requirePermission('VIEW_TRIPS'),
  tripController.getTripById
);

router.post('/',
  authenticate,
  requirePermission('CREATE_TRIP'),
  tripController.createTrip
);

router.patch('/:id',
  authenticate,
  requirePermission('UPDATE_TRIP'),
  tripController.updateTrip
);

router.delete('/:id',
  authenticate,
  requirePermission('DELETE_TRIP'),
  tripController.deleteTrip
);

router.post('/:id/dispatch',
  authenticate,
  requirePermission('CREATE_TRIP'),
  tripController.dispatchTrip
);

router.post('/:id/start',
  authenticate,
  requirePermission('START_END_TRIP'),
  tripController.startTrip
);

router.post('/:id/complete',
  authenticate,
  requirePermission('START_END_TRIP'),
  tripController.completeTrip
);

router.post('/:id/cancel',
  authenticate,
  requirePermission('DELETE_TRIP'),
  tripController.cancelTrip
);

router.post('/:id/proof-of-delivery',
  authenticate,
  requireRoles('driver', 'dispatcher'),
  tripController.addProofOfDelivery
);

router.post('/:id/rate',
  authenticate,
  tripController.rateTrip
);

router.get('/:id/expenses',
  authenticate,
  tripController.getTripExpenses
);

export default router;
