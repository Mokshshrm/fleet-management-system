import { Trip, Vehicle, Driver, Expense, FuelLog, User } from '../models/index.js';

export const getAllTrips = async (req, res) => {
  try {
    const { status, vehicleId, driverId, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.companyId };

    if (status) query.status = status;
    if (vehicleId) query.vehicleId = vehicleId;
    if (driverId) query.driverId = driverId;

    const total = await Trip.countDocuments(query);
    const trips = await Trip.find(query)
      .populate('vehicleId', 'name licensePlate vehicleType status')
      .populate('driverId', 'firstName lastName phone email status')
      .populate('createdBy', 'firstName lastName email')
      .sort({ 'schedule.plannedDepartureTime': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Add calculated fields and related data counts
    const enrichedTrips = await Promise.all(trips.map(async (trip) => {
      const [expenseCount, fuelLogCount] = await Promise.all([
        Expense.countDocuments({ tripId: trip._id }),
        FuelLog.countDocuments({ tripId: trip._id })
      ]);

      // Calculate actual distance
      let actualDistance = null;
      if (trip.odometer?.start && trip.odometer?.end) {
        actualDistance = trip.odometer.end - trip.odometer.start;
      }

      // Calculate duration
      let duration = null;
      if (trip.schedule?.actualDepartureTime && trip.schedule?.actualArrivalTime) {
        duration = new Date(trip.schedule.actualArrivalTime) - new Date(trip.schedule.actualDepartureTime);
      }

      // Calculate if delayed
      let isDelayed = false;
      if (trip.schedule?.plannedArrivalTime && trip.schedule?.actualArrivalTime) {
        isDelayed = new Date(trip.schedule.actualArrivalTime) > new Date(trip.schedule.plannedArrivalTime);
      }

      return {
        ...trip,
        actualDistance,
        duration,
        isDelayed,
        expenseCount,
        fuelLogCount
      };
    }));

    res.json({
      status: 'success',
      data: {
        trips: enrichedTrips,
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
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone'
        }
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email')
      .lean();

    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'Trip not found' });
    }

    // Get all related data
    const [expenses, fuelLogs] = await Promise.all([
      Expense.find({ tripId: trip._id, companyId: req.companyId })
        .populate('vehicleId', 'name licensePlate')
        .populate('recordedBy', 'firstName lastName')
        .sort({ date: -1 }),
      FuelLog.find({ tripId: trip._id, companyId: req.companyId })
        .populate('vehicleId', 'name licensePlate')
        .populate('driverId', 'firstName lastName')
        .populate('recordedBy', 'firstName lastName')
        .sort({ date: -1 })
    ]);

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const totalFuelCost = fuelLogs.reduce((sum, fuel) => sum + (fuel.totalCost || 0), 0);

    const totalFuelQuantity = fuelLogs.reduce((sum, fuel) => sum + (fuel.quantity?.value || 0), 0);

    let actualDistance = null;
    if (trip.odometer?.start && trip.odometer?.end) {
      actualDistance = {
        value: trip.odometer.end - trip.odometer.start,
        unit: trip.odometer.unit || 'km'
      };
    }

    let duration = null;
    if (trip.schedule?.actualDepartureTime && trip.schedule?.actualArrivalTime) {
      const durationMs = new Date(trip.schedule.actualArrivalTime) - new Date(trip.schedule.actualDepartureTime);
      duration = {
        milliseconds: durationMs,
        hours: (durationMs / (1000 * 60 * 60)).toFixed(2),
        days: (durationMs / (1000 * 60 * 60 * 24)).toFixed(2)
      };
    }

    let delay = null;
    if (trip.schedule?.plannedArrivalTime && trip.schedule?.actualArrivalTime) {
      const delayMs = new Date(trip.schedule.actualArrivalTime) - new Date(trip.schedule.plannedArrivalTime);
      delay = {
        isDelayed: delayMs > 0,
        milliseconds: delayMs,
        hours: (delayMs / (1000 * 60 * 60)).toFixed(2)
      };
    }

    // Calculate fuel efficiency (if available)
    let fuelEfficiency = null;
    if (actualDistance && totalFuelQuantity > 0) {
      fuelEfficiency = {
        value: (actualDistance.value / totalFuelQuantity).toFixed(2),
        unit: `${actualDistance.unit}/liter`
      };
    }

    // Calculate revenue metrics
    const totalCost = totalExpenses + totalFuelCost;
    const revenue = trip.revenue?.amount || 0;
    const profit = revenue - totalCost;
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

    res.json({
      status: 'success',
      data: {
        trip,
        relatedData: {
          expenses,
          fuelLogs
        },
        analytics: {
          actualDistance,
          duration,
          delay,
          fuelEfficiency,
          financials: {
            totalExpenses,
            totalFuelCost,
            totalCost,
            revenue,
            profit,
            profitMargin: `${profitMargin}%`
          },
          counts: {
            expenses: expenses.length,
            fuelLogs: fuelLogs.length
          }
        }
      }
    });
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

    const today = new Date();
    const dateStr = today.toISOString();
    const tripNumberPrefix = `TRP-${dateStr}-`;
    
    const lastTrip = await Trip.findOne({ 
      companyId: req.companyId,
      tripNumber: { $regex: `^${tripNumberPrefix}` }
    })
      .sort({ tripNumber: -1 })
      .select('tripNumber');
    
    let sequence = 1;
    if (lastTrip && lastTrip.tripNumber) {
      const lastSequence = parseInt(lastTrip.tripNumber.split('-').pop());
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
    const tripNumber = `${tripNumberPrefix}${sequence.toString().padStart(4, '0')}`;

    const trip = await Trip.create({
      ...req.body,
      tripNumber,
      companyId: req.companyId,
      createdBy: req.userId
    });

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({ status: 'success', data: { trip: populatedTrip } });
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

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    res.json({ status: 'success', data: { trip: populatedTrip } });
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

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    res.json({ status: 'success', data: { trip: populatedTrip } });
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

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    res.json({ status: 'success', data: { trip: populatedTrip } });
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

    // Get trip analytics
    const [expenses, fuelLogs] = await Promise.all([
      Expense.find({ tripId: trip._id }),
      FuelLog.find({ tripId: trip._id })
    ]);

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalFuelCost = fuelLogs.reduce((sum, fuel) => sum + (fuel.totalCost || 0), 0);
    const actualDistance = trip.odometer.end - trip.odometer.start;

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      status: 'success',
      data: {
        trip: populatedTrip,
        summary: {
          actualDistance: { value: actualDistance, unit: trip.odometer.unit || 'km' },
          totalExpenses,
          totalFuelCost,
          totalCost: totalExpenses + totalFuelCost
        }
      }
    });
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

    const previousStatus = trip.status;
    
    trip.status = 'cancelled';
    trip.cancelReason = cancelReason;
    trip.cancelledBy = req.userId;
    trip.cancelledAt = new Date();
    await trip.save();

    if (previousStatus === 'dispatched' || previousStatus === 'in_progress') {
      await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'available' });
      await Driver.findByIdAndUpdate(trip.driverId, { status: 'off_duty' });

      const driver = await Driver.findById(trip.driverId);
      driver.performance.totalTrips += 1;
      driver.performance.cancelledTrips += 1;
      await driver.save();
    }

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email');

    res.json({ status: 'success', data: { trip: populatedTrip } });
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

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    res.json({ status: 'success', data: { trip: populatedTrip } });
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

    // Populate and return detailed trip
    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId')
      .populate('driverId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      status: 'success',
      data: {
        trip: populatedTrip,
        driverStats: {
          averageRating: avgRating.toFixed(2),
          totalRatedTrips: allRatings.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getTripExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ tripId: req.params.id, companyId: req.companyId })
      .populate('vehicleId', 'name licensePlate')
      .populate('tripId', 'tripNumber')
      .populate('recordedBy', 'firstName lastName email')
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        expenses,
        summary: {
          totalAmount,
          count: expenses.length,
          byCategory: expensesByCategory
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
