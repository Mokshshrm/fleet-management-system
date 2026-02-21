import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from '../models/index.js';

export const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.companyId;

    const totalVehicles = await Vehicle.countDocuments({ companyId });
    const activeVehicles = await Vehicle.countDocuments({ companyId, status: 'on_trip' });
    const inShopVehicles = await Vehicle.countDocuments({ companyId, status: 'in_shop' });
    const availableVehicles = await Vehicle.countDocuments({ companyId, status: 'available' });

    const totalDrivers = await Driver.countDocuments({ companyId });
    const activeDrivers = await Driver.countDocuments({ companyId, status: 'on_trip' });

    const tripsInProgress = await Trip.countDocuments({ companyId, status: 'in_progress' });
    const dispatchedTrips = await Trip.countDocuments({ companyId, status: 'dispatched' });
    const completedTripsToday = await Trip.countDocuments({
      companyId,
      status: 'completed',
      'schedule.actualArrivalTime': { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    const pendingExpenses = await Expense.countDocuments({ companyId, status: 'pending' });

    const utilizationRate = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(2) : 0;

    res.json({
      status: 'success',
      data: {
        fleet: {
          total: totalVehicles,
          active: activeVehicles,
          available: availableVehicles,
          inShop: inShopVehicles,
          utilizationRate: parseFloat(utilizationRate)
        },
        drivers: {
          total: totalDrivers,
          active: activeDrivers,
          available: totalDrivers - activeDrivers
        },
        trips: {
          inProgress: tripsInProgress,
          dispatched: dispatchedTrips,
          completedToday: completedTripsToday
        },
        expenses: {
          pending: pendingExpenses
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getFleetOverview = async (req, res) => {
  try {
    const companyId = req.companyId;

    const vehicles = await Vehicle.find({ companyId });

    const vehicleTypeBreakdown = {};
    vehicles.forEach(vehicle => {
      vehicleTypeBreakdown[vehicle.vehicleType] = (vehicleTypeBreakdown[vehicle.vehicleType] || 0) + 1;
    });

    const statusBreakdown = {};
    vehicles.forEach(vehicle => {
      statusBreakdown[vehicle.status] = (statusBreakdown[vehicle.status] || 0) + 1;
    });

    const averageAge = vehicles.reduce((sum, v) => {
      const age = new Date().getFullYear() - v.year;
      return sum + age;
    }, 0) / vehicles.length || 0;

    res.json({
      status: 'success',
      data: {
        totalVehicles: vehicles.length,
        vehicleTypeBreakdown,
        statusBreakdown,
        averageFleetAge: averageAge.toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getVehicleROI = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const companyId = req.companyId;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    const maintenanceCosts = await MaintenanceLog.find({ vehicleId, companyId });
    const totalMaintenance = maintenanceCosts.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    const fuelCosts = await FuelLog.find({ vehicleId, companyId });
    const totalFuel = fuelCosts.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    const otherExpenses = await Expense.find({ vehicleId, companyId });
    const totalExpenses = otherExpenses.reduce((sum, exp) => sum + (exp.amount?.value || 0), 0);

    const totalCosts = totalMaintenance + totalFuel + totalExpenses;

    const trips = await Trip.find({ vehicleId, companyId, status: 'completed' });
    const completedTrips = trips.length;

    const acquisitionCost = vehicle.acquisitionCost?.value || 0;
    const roi = acquisitionCost > 0 ? (((totalCosts - acquisitionCost) / acquisitionCost) * 100) : 0;

    res.json({
      status: 'success',
      data: {
        vehicle: {
          id: vehicle._id,
          name: vehicle.name,
          licensePlate: vehicle.licensePlate
        },
        acquisitionCost: { value: acquisitionCost, currency: 'USD' },
        totalMaintenance: { value: totalMaintenance, currency: 'USD' },
        totalFuel: { value: totalFuel, currency: 'USD' },
        totalExpenses: { value: totalExpenses, currency: 'USD' },
        totalOperatingCosts: { value: totalCosts, currency: 'USD' },
        completedTrips,
        roi: roi.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getFuelEfficiencyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.companyId;
    const query = { companyId };

    if (startDate || endDate) {
      query.fuelDate = {};
      if (startDate) query.fuelDate.$gte = new Date(startDate);
      if (endDate) query.fuelDate.$lte = new Date(endDate);
    }

    const fuelLogs = await FuelLog.find(query).populate('vehicleId', 'name licensePlate vehicleType');

    const vehicleEfficiency = {};
    fuelLogs.forEach(log => {
      if (log.fuelEfficiency?.value && log.vehicleId) {
        const vehicleKey = log.vehicleId._id.toString();
        if (!vehicleEfficiency[vehicleKey]) {
          vehicleEfficiency[vehicleKey] = {
            vehicle: log.vehicleId,
            efficiencies: [],
            totalCost: 0,
            totalQuantity: 0
          };
        }
        vehicleEfficiency[vehicleKey].efficiencies.push(log.fuelEfficiency.value);
        vehicleEfficiency[vehicleKey].totalCost += log.cost?.total || 0;
        vehicleEfficiency[vehicleKey].totalQuantity += log.quantity?.value || 0;
      }
    });

    const report = Object.values(vehicleEfficiency).map(data => ({
      vehicle: data.vehicle,
      averageEfficiency: {
        value: (data.efficiencies.reduce((sum, val) => sum + val, 0) / data.efficiencies.length).toFixed(2),
        unit: 'km/L'
      },
      totalFuelConsumption: { value: data.totalQuantity, unit: 'L' },
      totalFuelCost: { value: data.totalCost, currency: 'USD' }
    })).sort((a, b) => b.averageEfficiency.value - a.averageEfficiency.value);

    res.json({ status: 'success', data: { fuelEfficiencyReport: report } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMaintenanceCostReport = async (req, res) => {
  try {
    const { startDate, endDate, vehicleId } = req.query;
    const companyId = req.companyId;
    const query = { companyId };

    if (vehicleId) query.vehicleId = vehicleId;
    if (startDate || endDate) {
      query.maintenanceDate = {};
      if (startDate) query.maintenanceDate.$gte = new Date(startDate);
      if (endDate) query.maintenanceDate.$lte = new Date(endDate);
    }

    const maintenanceLogs = await MaintenanceLog.find(query).populate('vehicleId', 'name licensePlate');

    const vehicleCosts = {};
    const typeCosts = {};

    maintenanceLogs.forEach(log => {
      const cost = log.cost?.total || 0;

      if (log.vehicleId) {
        const vehicleKey = log.vehicleId._id.toString();
        if (!vehicleCosts[vehicleKey]) {
          vehicleCosts[vehicleKey] = {
            vehicle: log.vehicleId,
            totalCost: 0,
            records: 0
          };
        }
        vehicleCosts[vehicleKey].totalCost += cost;
        vehicleCosts[vehicleKey].records++;
      }

      const maintenanceType = log.type;
      if (!typeCosts[maintenanceType]) {
        typeCosts[maintenanceType] = { totalCost: 0, records: 0 };
      }
      typeCosts[maintenanceType].totalCost += cost;
      typeCosts[maintenanceType].records++;
    });

    const totalCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    res.json({
      status: 'success',
      data: {
        totalMaintenanceCost: { value: totalCost, currency: 'USD' },
        totalRecords: maintenanceLogs.length,
        costByVehicle: Object.values(vehicleCosts),
        costByType: typeCosts
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDriverPerformanceReport = async (req, res) => {
  try {
    const companyId = req.companyId;

    const drivers = await Driver.find({ companyId });

    const performanceReport = await Promise.all(drivers.map(async (driver) => {
      const trips = await Trip.find({ driverId: driver._id, companyId });
      const completedTrips = trips.filter(t => t.status === 'completed').length;
      const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
      
      const ratings = trips.filter(t => t.rating?.score).map(t => t.rating.score);
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, val) => sum + val, 0) / ratings.length).toFixed(2)
        : 0;

      return {
        driver: {
          id: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          phone: driver.phone,
          status: driver.status
        },
        performance: {
          totalTrips: driver.performance.totalTrips,
          completedTrips: driver.performance.completedTrips,
          cancelledTrips: driver.performance.cancelledTrips,
          totalDistance: driver.performance.totalDistance,
          averageRating: parseFloat(avgRating),
          safetyScore: driver.safetyScore.currentScore,
          incidents: driver.incidents.length
        }
      };
    }));

    res.json({ status: 'success', data: { driverPerformanceReport: performanceReport } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getTripReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const companyId = req.companyId;
    const query = { companyId };

    if (status) query.status = status;
    if (startDate || endDate) {
      query['schedule.plannedDepartureTime'] = {};
      if (startDate) query['schedule.plannedDepartureTime'].$gte = new Date(startDate);
      if (endDate) query['schedule.plannedDepartureTime'].$lte = new Date(endDate);
    }

    const trips = await Trip.find(query)
      .populate('vehicleId', 'name licensePlate')
      .populate('driverId', 'firstName lastName');

    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
    const inProgressTrips = trips.filter(t => t.status === 'in_progress').length;

    const totalDistance = trips.reduce((sum, trip) => {
      if (trip.odometer?.end && trip.odometer?.start) {
        return sum + (trip.odometer.end - trip.odometer.start);
      }
      return sum;
    }, 0);

    const avgRating = trips.filter(t => t.rating?.score)
      .reduce((sum, t, _, arr) => sum + t.rating.score / arr.length, 0);

    res.json({
      status: 'success',
      data: {
        totalTrips,
        completedTrips,
        cancelledTrips,
        inProgressTrips,
        totalDistance: { value: totalDistance, unit: 'km' },
        averageRating: avgRating.toFixed(2),
        trips: trips.slice(0, 100)
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.companyId;
    const dateQuery = {};

    if (startDate || endDate) {
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) dateQuery.$lte = new Date(endDate);
    }

    const expenseQuery = { companyId };
    if (startDate || endDate) expenseQuery.expenseDate = dateQuery;

    const expenses = await Expense.find(expenseQuery);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount?.value || 0), 0);

    const fuelQuery = { companyId };
    if (startDate || endDate) fuelQuery.date = dateQuery;
    const fuelLogs = await FuelLog.find(fuelQuery);
    const totalFuel = fuelLogs.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    const maintenanceQuery = { companyId };
    if (startDate || endDate) maintenanceQuery['schedule.scheduledDate'] = dateQuery;
    const maintenanceLogs = await MaintenanceLog.find(maintenanceQuery);
    const totalMaintenance = maintenanceLogs.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    const totalOperatingCosts = totalExpenses + totalFuel + totalMaintenance;

    const categoryBreakdown = {};
    expenses.forEach(exp => {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + (exp.amount?.value || 0);
    });

    res.json({
      status: 'success',
      data: {
        totalExpenses: { value: totalExpenses, currency: 'USD' },
        totalFuelCosts: { value: totalFuel, currency: 'USD' },
        totalMaintenanceCosts: { value: totalMaintenance, currency: 'USD' },
        totalOperatingCosts: { value: totalOperatingCosts, currency: 'USD' },
        categoryBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    res.status(501).json({ status: 'error', message: 'Export functionality not implemented yet' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getOperationalCosts = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const companyId = req.companyId;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    const fuelCosts = await FuelLog.find({ vehicleId, companyId });
    const totalFuel = fuelCosts.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    const maintenanceCosts = await MaintenanceLog.find({ vehicleId, companyId });
    const totalMaintenance = maintenanceCosts.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    const otherExpenses = await Expense.find({ vehicleId, companyId });
    const totalExpenses = otherExpenses.reduce((sum, exp) => sum + (exp.amount?.value || 0), 0);

    const totalCosts = totalFuel + totalMaintenance + totalExpenses;

    res.json({
      status: 'success',
      data: {
        vehicle: {
          id: vehicle._id,
          name: vehicle.name,
          licensePlate: vehicle.licensePlate
        },
        fuelCosts: { value: totalFuel, currency: 'USD' },
        maintenanceCosts: { value: totalMaintenance, currency: 'USD' },
        otherExpenses: { value: totalExpenses, currency: 'USD' },
        totalOperatingCosts: { value: totalCosts, currency: 'USD' }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    res.status(501).json({ status: 'error', message: 'Revenue tracking not implemented yet' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getUtilizationReport = async (req, res) => {
  // TODO: Get fleet utilization report
};
