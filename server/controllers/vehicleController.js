import { Vehicle, Trip, MaintenanceLog, Expense, FuelLog } from '../models/index.js';

export const getAllVehicles = async (req, res) => {
  try {
    const { vehicleType, status, region, search, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.companyId };
    
    if (vehicleType) query.vehicleType = vehicleType;
    if (status) query.status = status;
    if (region) query.region = { $regex: region, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        vehicles,
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

export const getAvailableVehicles = async (req, res) => {
  try {
    const { vehicleType } = req.query;
    const query = { companyId: req.companyId, status: 'available', isActive: true };
    if (vehicleType) query.vehicleType = vehicleType;

    const vehicles = await Vehicle.find(query)
      .select('name licensePlate vehicleType maxLoadCapacity odometer status')
      .sort({ name: 1 });

    res.json({ status: 'success', data: { vehicles } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }
    res.json({ status: 'success', data: { vehicle } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const existingVehicle = await Vehicle.findOne({ licensePlate: req.body.licensePlate });
    if (existingVehicle) {
      return res.status(400).json({ status: 'error', message: 'License plate already exists' });
    }

    if (req.body.vin) {
      const existingVin = await Vehicle.findOne({ vin: req.body.vin });
      if (existingVin) {
        return res.status(400).json({ status: 'error', message: 'VIN already exists' });
      }
    }

    const vehicle = await Vehicle.create({ ...req.body, companyId: req.companyId });
    res.status(201).json({ status: 'success', data: { vehicle } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    if (req.body.status && req.body.status !== vehicle.status) {
      if (vehicle.status === 'on_trip') {
        const activeTrip = await Trip.findOne({
          vehicleId: vehicle._id,
          status: { $in: ['dispatched', 'in_progress'] }
        });
        if (activeTrip) {
          return res.status(400).json({ status: 'error', message: 'Vehicle has active trip' });
        }
      }

      if (vehicle.status === 'in_shop') {
        const activeMaintenance = await MaintenanceLog.findOne({
          vehicleId: vehicle._id,
          status: 'in_progress'
        });
        if (activeMaintenance) {
          return res.status(400).json({ status: 'error', message: 'Vehicle has active maintenance' });
        }
      }
    }

    if (req.body.licensePlate && req.body.licensePlate !== vehicle.licensePlate) {
      const existingPlate = await Vehicle.findOne({
        licensePlate: req.body.licensePlate,
        _id: { $ne: vehicle._id }
      });
      if (existingPlate) {
        return res.status(400).json({ status: 'error', message: 'License plate already exists' });
      }
    }

    if (req.body.odometer?.current) {
      req.body['odometer.lastUpdated'] = new Date();
    }

    Object.assign(vehicle, req.body);
    await vehicle.save();

    res.json({ status: 'success', data: { vehicle } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    const activeTrip = await Trip.findOne({
      vehicleId: vehicle._id,
      status: { $in: ['dispatched', 'in_progress'] }
    });
    if (activeTrip) {
      return res.status(400).json({ status: 'error', message: 'Cannot delete vehicle with active trips' });
    }

    const tripCount = await Trip.countDocuments({ vehicleId: vehicle._id });
    if (tripCount > 0) {
      vehicle.status = 'retired';
      vehicle.isActive = false;
      await vehicle.save();
      return res.json({ status: 'success', message: 'Vehicle marked as retired' });
    }

    await Vehicle.deleteOne({ _id: vehicle._id });
    res.json({ status: 'success', message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getVehicleTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { vehicleId: req.params.id, companyId: req.companyId };
    if (status) query.status = status;

    const total = await Trip.countDocuments(query);
    const trips = await Trip.find(query)
      .populate('driverId', 'firstName lastName')
      .sort({ 'schedule.plannedDepartureTime': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        trips,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getVehicleMaintenance = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { vehicleId: req.params.id, companyId: req.companyId };
    if (status) query.status = status;

    const total = await MaintenanceLog.countDocuments(query);
    const maintenanceLogs = await MaintenanceLog.find(query)
      .populate('performedBy', 'firstName lastName')
      .sort({ 'schedule.scheduledDate': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        maintenanceLogs,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getVehicleExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { vehicleId: req.params.id, companyId: req.companyId };

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        expenses,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getVehicleStats = async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const totalTrips = await Trip.countDocuments({ vehicleId, companyId: req.companyId });
    const completedTrips = await Trip.countDocuments({ vehicleId, companyId: req.companyId, status: 'completed' });
    
    const fuelExpenses = await Expense.aggregate([
      { $match: { vehicleId: vehicleId, companyId: req.companyId, category: 'fuel' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const maintenanceExpenses = await Expense.aggregate([
      { $match: { vehicleId: vehicleId, companyId: req.companyId, category: { $in: ['maintenance', 'repair'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      status: 'success',
      data: {
        totalTrips,
        completedTrips,
        fuelExpenses: fuelExpenses[0]?.total || 0,
        maintenanceExpenses: maintenanceExpenses[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
