import express from 'express';
import { authenticate, requireRole, requireRoles } from '../middleware/auth.js';
import * as tripController from '../controllers/tripController.js';

const router = express.Router();

router.get('/',
  authenticate,
  tripController.getAllTrips
);

router.get('/:id',
  authenticate,
  tripController.getTripById
);

router.post('/',
  authenticate,
  requireRoles('dispatcher', 'fleet_manager', 'admin'),
  tripController.createTrip
);

router.patch('/:id',
  authenticate,
  requireRoles('dispatcher', 'fleet_manager', 'admin'),
  tripController.updateTrip
);

router.delete('/:id',
  authenticate,
  requireRole('admin'),
  tripController.deleteTrip
);

router.post('/:id/dispatch',
  authenticate,
  requireRoles('dispatcher', 'fleet_manager', 'admin'),
  tripController.dispatchTrip
);

router.post('/:id/start',
  authenticate,
  requireRoles('driver', 'dispatcher'),
  tripController.startTrip
);

router.post('/:id/complete',
  authenticate,
  requireRoles('driver', 'dispatcher'),
  tripController.completeTrip
);

router.post('/:id/cancel',
  authenticate,
  requireRoles('dispatcher', 'fleet_manager', 'admin'),
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
