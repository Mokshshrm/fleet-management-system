import { MaintenanceLog, Vehicle } from '../models/index.js';

export const getAllMaintenanceLogs = async (req, res) => {
  try {
    const { status, vehicleId, type, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.companyId };

    if (status) query.status = status;
    if (vehicleId) query.vehicleId = vehicleId;
    if (type) query.type = type;

    const total = await MaintenanceLog.countDocuments(query);
    const logs = await MaintenanceLog.find(query)
      .populate('vehicleId', 'name licensePlate vehicleType')
      .populate('performedBy', 'firstName lastName')
      .sort({ 'schedule.scheduledDate': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        maintenanceLogs: logs,
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

export const getMaintenanceById = async (req, res) => {
  try {
    const log = await MaintenanceLog.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('vehicleId')
      .populate('performedBy', 'firstName lastName');

    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Maintenance log not found' });
    }
    res.json({ status: 'success', data: { maintenanceLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createMaintenanceLog = async (req, res) => {
  try {
    const { vehicleId, status } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId: req.companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    if (status === 'in_progress' && vehicle.status === 'on_trip') {
      return res.status(400).json({ status: 'error', message: 'Cannot schedule maintenance for vehicle on trip' });
    }

    const log = await MaintenanceLog.create({
      ...req.body,
      companyId: req.companyId
    });

    if (status === 'in_progress') {
      vehicle.status = 'in_shop';
      await vehicle.save();
    }

    res.status(201).json({ status: 'success', data: { maintenanceLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateMaintenanceLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Maintenance log not found' });
    }

    const oldStatus = log.status;
    Object.assign(log, req.body);
    await log.save();

    if (oldStatus !== 'completed' && log.status === 'completed') {
      const vehicle = await Vehicle.findById(log.vehicleId);
      if (vehicle && vehicle.status === 'in_shop') {
        vehicle.status = 'available';
        await vehicle.save();
      }
    } else if (oldStatus !== 'in_progress' && log.status === 'in_progress') {
      const vehicle = await Vehicle.findById(log.vehicleId);
      if (vehicle && vehicle.status === 'available') {
        vehicle.status = 'in_shop';
        await vehicle.save();
      }
    }

    res.json({ status: 'success', data: { maintenanceLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteMaintenanceLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Maintenance log not found' });
    }

    if (log.status === 'in_progress') {
      const vehicle = await Vehicle.findById(log.vehicleId);
      if (vehicle && vehicle.status === 'in_shop') {
        vehicle.status = 'available';
        await vehicle.save();
      }
    }

    await MaintenanceLog.deleteOne({ _id: log._id });
    res.json({ status: 'success', message: 'Maintenance log deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const scheduleMaintenence = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId: req.companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    const log = await MaintenanceLog.create({
      ...req.body,
      companyId: req.companyId,
      status: 'scheduled'
    });

    res.status(201).json({ status: 'success', data: { maintenanceLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const startMaintenance = async (req, res) => {
  try {
    const log = await MaintenanceLog.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Maintenance log not found' });
    }

    if (log.status === 'in_progress') {
      return res.status(400).json({ status: 'error', message: 'Maintenance already in progress' });
    }

    const vehicle = await Vehicle.findById(log.vehicleId);
    if (vehicle && vehicle.status === 'on_trip') {
      return res.status(400).json({ status: 'error', message: 'Cannot start maintenance for vehicle on trip' });
    }

    log.status = 'in_progress';
    await log.save();

    if (vehicle && vehicle.status === 'available') {
      vehicle.status = 'in_shop';
      await vehicle.save();
    }

    res.json({ status: 'success', data: { maintenanceLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const completeMaintenance = async (req, res) => {
  try {
    const log = await MaintenanceLog.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Maintenance log not found' });
    }

    if (log.status === 'completed') {
      return res.status(400).json({ status: 'error', message: 'Maintenance already completed' });
    }

    log.status = 'completed';
    if (req.body.completedAt) {
      log.schedule.completedAt = req.body.completedAt;
    } else {
      log.schedule.completedAt = new Date();
    }
    if (req.body.notes) {
      log.notes = req.body.notes;
    }
    await log.save();

    const vehicle = await Vehicle.findById(log.vehicleId);
    if (vehicle && vehicle.status === 'in_shop') {
      vehicle.status = 'available';
      await vehicle.save();
    }

    res.json({ status: 'success', data: { maintenanceLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const cancelMaintenance = async (req, res) => {
  try {
    const log = await MaintenanceLog.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Maintenance log not found' });
    }

    if (log.status === 'completed') {
      return res.status(400).json({ status: 'error', message: 'Cannot cancel completed maintenance' });
    }

    log.status = 'cancelled';
    await log.save();

    const vehicle = await Vehicle.findById(log.vehicleId);
    if (vehicle && vehicle.status === 'in_shop') {
      vehicle.status = 'available';
      await vehicle.save();
    }

    res.json({ status: 'success', data: { maintenanceLog: log } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMaintenanceStats = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const query = { companyId: req.companyId };
    if (vehicleId) query.vehicleId = vehicleId;

    const logs = await MaintenanceLog.find(query);

    const totalSpent = logs.reduce((sum, log) => sum + (log.cost?.total || 0), 0);
    const totalMaintenance = logs.length;
    const scheduled = logs.filter(log => log.status === 'scheduled').length;
    const inProgress = logs.filter(log => log.status === 'in_progress').length;
    const completed = logs.filter(log => log.status === 'completed').length;
    const cancelled = logs.filter(log => log.status === 'cancelled').length;

    const preventive = logs.filter(log => log.type === 'preventive').length;
    const corrective = logs.filter(log => log.type === 'corrective').length;
    const emergency = logs.filter(log => log.type === 'emergency').length;

    res.json({
      status: 'success',
      data: {
        totalMaintenance,
        totalSpent: { value: totalSpent, currency: 'USD' },
        statusBreakdown: { scheduled, inProgress, completed, cancelled },
        typeBreakdown: { preventive, corrective, emergency }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
