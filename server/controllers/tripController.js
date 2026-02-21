import { Trip, Vehicle, Driver, Expense } from '../models/index.js';

export const getAllTrips = async (req, res) => {
  try {
    const { status, vehicleId, driverId, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.companyId };

    if (status) query.status = status;
    if (vehicleId) query.vehicleId = vehicleId;
    if (driverId) query.driverId = driverId;

    const total = await Trip.countDocuments(query);
    const trips = await Trip.find(query)
      .populate('vehicleId', 'name licensePlate vehicleType')
      .populate('driverId', 'firstName lastName phone')
      .sort({ 'schedule.plannedDepartureTime': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        trips,
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

export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('vehicleId')
      .populate('driverId')
      .populate('createdBy', 'firstName lastName');

    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }
    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createTrip = async (req, res) => {
  try {
    const { vehicleId, driverId, cargo } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId: req.companyId });
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({ status: 'error', message: 'Vehicle is not available' });
    }

    const driver = await Driver.findOne({ _id: driverId, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }

    if (driver.status === 'on_trip') {
      return res.status(400).json({ status: 'error', message: 'Driver is already on a trip' });
    }

    if (new Date(driver.license.expiryDate) <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Driver license has expired' });
    }

    if (!driver.canDriveVehicleType(vehicle.vehicleType)) {
      return res.status(400).json({ status: 'error', message: 'Driver not licensed for this vehicle type' });
    }

    const cargoWeight = cargo.weight.value;
    const vehicleCapacity = vehicle.maxLoadCapacity.value;
    if (cargo.weight.unit === vehicle.maxLoadCapacity.unit && cargoWeight > vehicleCapacity) {
      return res.status(400).json({ status: 'error', message: 'Cargo weight exceeds vehicle capacity' });
    }

    const trip = await Trip.create({
      ...req.body,
      companyId: req.companyId,
      createdBy: req.userId
    });

    res.status(201).json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return res.status(400).json({ status: 'error', message: 'Cannot update completed or cancelled trip' });
    }

    Object.assign(trip, req.body);
    await trip.save();

    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    if (trip.status === 'in_progress') {
      return res.status(400).json({ status: 'error', message: 'Cannot delete trip in progress' });
    }

    await Trip.deleteOne({ _id: trip._id });
    res.json({ status: 'success', message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const dispatchTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    if (trip.status !== 'draft') {
      return res.status(400).json({ status: 'error', message: 'Only draft trips can be dispatched' });
    }

    await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'on_trip' });
    await Driver.findByIdAndUpdate(trip.driverId, { status: 'on_trip' });

    trip.status = 'dispatched';
    await trip.save();

    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const startTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    if (trip.status !== 'dispatched') {
      return res.status(400).json({ status: 'error', message: 'Only dispatched trips can be started' });
    }

    trip.status = 'in_progress';
    trip.schedule.actualDepartureTime = new Date();
    if (req.body.odometer?.start) {
      trip.odometer.start = req.body.odometer.start;
    }
    await trip.save();

    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const completeTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    if (trip.status !== 'in_progress') {
      return res.status(400).json({ status: 'error', message: 'Only in-progress trips can be completed' });
    }

    trip.status = 'completed';
    trip.schedule.actualArrivalTime = new Date();
    if (req.body.odometer?.end) {
      trip.odometer.end = req.body.odometer.end;
    }
    await trip.save();

    await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'available' });
    await Driver.findByIdAndUpdate(trip.driverId, { status: 'off_duty' });

    const driver = await Driver.findById(trip.driverId);
    driver.performance.totalTrips += 1;
    driver.performance.completedTrips += 1;
    if (trip.odometer.end && trip.odometer.start) {
      const distance = trip.odometer.end - trip.odometer.start;
      driver.performance.totalDistance.value += distance;
    }
    await driver.save();

    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const cancelTrip = async (req, res) => {
  try {
    const { cancelReason } = req.body;
    
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return res.status(400).json({ status: 'error', message: 'Trip is already completed or cancelled' });
    }

    trip.status = 'cancelled';
    trip.cancelReason = cancelReason;
    trip.cancelledBy = req.userId;
    trip.cancelledAt = new Date();
    await trip.save();

    if (trip.status === 'dispatched' || trip.status === 'in_progress') {
      await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'available' });
      await Driver.findByIdAndUpdate(trip.driverId, { status: 'off_duty' });

      const driver = await Driver.findById(trip.driverId);
      driver.performance.totalTrips += 1;
      driver.performance.cancelledTrips += 1;
      await driver.save();
    }

    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const addProofOfDelivery = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    trip.proofOfDelivery = {
      ...req.body,
      receivedAt: new Date()
    };
    await trip.save();

    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const rateTrip = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    
    const trip = await Trip.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    if (trip.status !== 'completed') {
      return res.status(400).json({ status: 'error', message: 'Only completed trips can be rated' });
    }

    trip.rating = { score, feedback, ratedAt: new Date() };
    await trip.save();

    const driver = await Driver.findById(trip.driverId);
    const allRatings = await Trip.find({ driverId: driver._id, 'rating.score': { $exists: true } });
    const avgRating = allRatings.reduce((sum, t) => sum + t.rating.score, 0) / allRatings.length;
    driver.performance.averageRating = avgRating;
    await driver.save();

    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getTripExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ tripId: req.params.id, companyId: req.companyId });
    res.json({ status: 'success', data: { expenses } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
