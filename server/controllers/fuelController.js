import { FuelLog, Vehicle, Driver } from '../models/index.js';

export const getAllFuelLogs = async (req, res) => {
  try {
    const { vehicleId, driverId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.companyId };

    if (vehicleId) query.vehicleId = vehicleId;
    if (driverId) query.driverId = driverId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await FuelLog.countDocuments(query);
    const logs = await FuelLog.find(query)
      .populate('vehicleId', 'name licensePlate vehicleType')
      .populate('driverId', 'firstName lastName')
      .populate('tripId', 'tripNumber')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        fuelLogs: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getFuelLogById = async (req, res) => {
  try {
    const log = await FuelLog.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('vehicleId')
      .populate('driverId')
      .populate('tripId');

    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Fuel log not found' });
    }
    res.json({ status: 'success', data: { fuelLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createFuelLog = async (req, res) => {
  try {
    const { vehicleId, driverId } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId: req.companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    if (driverId) {
      const driver = await Driver.findOne({ _id: driverId, companyId: req.companyId });
      if (!driver) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }
    }

    const log = await FuelLog.create({
      ...req.body,
      companyId: req.companyId
    });

    res.status(201).json({ status: 'success', data: { fuelLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Fuel log not found' });
    }

    Object.assign(log, req.body);
    await log.save();

    res.json({ status: 'success', data: { fuelLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Fuel log not found' });
    }

    await FuelLog.deleteOne({ _id: log._id });
    res.json({ status: 'success', message: 'Fuel log deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getVehicleFuelStats = async (req, res) => {
  try {
    const logs = await FuelLog.find({
      vehicleId: req.params.vehicleId,
      companyId: req.companyId
    })
      .populate('driverId', 'firstName lastName')
      .populate('tripId', 'tripNumber')
      .sort({ date: -1 });

    const totalQuantity = logs.reduce((sum, log) => sum + (log.quantity?.value || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.cost?.total || 0), 0);

    const efficiencies = logs.filter(log => log.fuelEfficiency?.value).map(log => log.fuelEfficiency.value);
    const avgEfficiency = efficiencies.length > 0
      ? efficiencies.reduce((sum, val) => sum + val, 0) / efficiencies.length
      : 0;

    const fuelTypes = {};
    logs.forEach(log => {
      if (log.fuelType) {
        fuelTypes[log.fuelType] = (fuelTypes[log.fuelType] || 0) + 1;
      }
    });

    res.json({
      status: 'success',
      data: {
        fuelLogs: logs,
        totalFuelRecords: logs.length,
        totalQuantity: { value: totalQuantity, unit: 'L' },
        totalCost: { value: totalCost, currency: 'USD' },
        averageFuelEfficiency: { value: avgEfficiency, unit: 'km/L' },
        fuelTypeBreakdown: fuelTypes
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getFuelEfficiencyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { companyId: req.companyId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await FuelLog.find(query)
      .populate('vehicleId', 'name licensePlate vehicleType')
      .populate('driverId', 'firstName lastName');

    const vehicleEfficiency = {};
    const driverEfficiency = {};

    logs.forEach(log => {
      if (log.fuelEfficiency?.value) {
        if (log.vehicleId) {
          const vehicleKey = log.vehicleId._id.toString();
          if (!vehicleEfficiency[vehicleKey]) {
            vehicleEfficiency[vehicleKey] = {
              vehicle: log.vehicleId,
              totalRecords: 0,
              efficiencies: []
            };
          }
          vehicleEfficiency[vehicleKey].totalRecords++;
          vehicleEfficiency[vehicleKey].efficiencies.push(log.fuelEfficiency.value);
        }

        if (log.driverId) {
          const driverKey = log.driverId._id.toString();
          if (!driverEfficiency[driverKey]) {
            driverEfficiency[driverKey] = {
              driver: log.driverId,
              totalRecords: 0,
              efficiencies: []
            };
          }
          driverEfficiency[driverKey].totalRecords++;
          driverEfficiency[driverKey].efficiencies.push(log.fuelEfficiency.value);
        }
      }
    });

    const vehicleReport = Object.values(vehicleEfficiency).map(data => ({
      vehicle: data.vehicle,
      totalRecords: data.totalRecords,
      averageEfficiency: {
        value: data.efficiencies.reduce((sum, val) => sum + val, 0) / data.efficiencies.length,
        unit: 'km/L'
      },
      minEfficiency: {
        value: Math.min(...data.efficiencies),
        unit: 'km/L'
      },
      maxEfficiency: {
        value: Math.max(...data.efficiencies),
        unit: 'km/L'
      }
    })).sort((a, b) => b.averageEfficiency.value - a.averageEfficiency.value);

    const driverReport = Object.values(driverEfficiency).map(data => ({
      driver: data.driver,
      totalRecords: data.totalRecords,
      averageEfficiency: {
        value: data.efficiencies.reduce((sum, val) => sum + val, 0) / data.efficiencies.length,
        unit: 'km/L'
      },
      minEfficiency: {
        value: Math.min(...data.efficiencies),
        unit: 'km/L'
      },
      maxEfficiency: {
        value: Math.max(...data.efficiencies),
        unit: 'km/L'
      }
    })).sort((a, b) => b.averageEfficiency.value - a.averageEfficiency.value);

    res.json({
      status: 'success',
      data: {
        vehicleEfficiencyReport: vehicleReport,
        driverEfficiencyReport: driverReport
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
