import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard',
  authenticate,
  analyticsController.getDashboardStats
);

router.get('/fleet-overview',
  authenticate,
  analyticsController.getFleetOverview
);

router.get('/vehicle-roi',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  analyticsController.getVehicleROI
);

router.get('/fuel-efficiency',
  authenticate,
  analyticsController.getFuelEfficiencyReport
);

router.get('/maintenance-costs',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  analyticsController.getMaintenanceCostReport
);

router.get('/driver-performance',
  authenticate,
  requireRoles('fleet_manager', 'safety_officer', 'admin'),
  analyticsController.getDriverPerformanceReport
);

router.get('/trips',
  authenticate,
  analyticsController.getTripReport
);

router.get('/financial',
  authenticate,
  requireRoles('financial_analyst', 'admin'),
  analyticsController.getFinancialReport
);

router.get('/operational-costs',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  analyticsController.getOperationalCosts
);

router.get('/revenue',
  authenticate,
  requireRoles('financial_analyst', 'admin'),
  analyticsController.getRevenueReport
);

router.get('/utilization',
  authenticate,
  requireRoles('fleet_manager', 'admin'),
  analyticsController.getUtilizationReport
);

router.post('/export',
  authenticate,
  requireRoles('fleet_manager', 'financial_analyst', 'admin'),
  analyticsController.exportReport
);

export default router;
