import { Driver, Trip, User, Company } from '../models/index.js';
import { sendDriverCredentials } from '../services/emailService.js';
import crypto from 'crypto';

export const getAllDrivers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.companyId };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Driver.countDocuments(query);
    const drivers = await Driver.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        drivers,
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

export const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({
      companyId: req.companyId,
      status: 'off_duty',
      isActive: true,
      'license.expiryDate': { $gt: new Date() }
    })
      .select('firstName lastName phone license status safetyScore')
      .sort({ firstName: 1 });

    res.json({ status: 'success', data: { drivers } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }
    res.json({ status: 'success', data: { driver } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createDriver = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      dateOfBirth,
      address,
      license,
      employmentType,
      hireDate
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'firstName, lastName, email, and phone are required' 
      });
    }

    if (!license || !license.number || !license.expiryDate) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'License number and expiry date are required' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email already registered in the system' 
      });
    }

    // Generate random password (8 characters: letters and numbers)
    const randomPassword = crypto.randomBytes(4).toString('hex') + 
                          String(Math.floor(Math.random() * 100)).padStart(2, '0');

    console.log(randomPassword)

    // Create User account with driver role
    const user = await User.create({
      companyId: req.companyId,
      email,
      password: randomPassword,
      firstName,
      lastName,
      phone,
      role: 'driver',
      isActive: true
    });

    // Create Driver entity linked to User
    const driver = await Driver.create({
      userId: user._id,
      companyId: req.companyId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth || undefined,
      address: address || undefined,
      license: {
        number: license.number,
        category: license.category || ['car'],
        issueDate: license.issueDate || undefined,
        expiryDate: license.expiryDate,
        issuingAuthority: license.issuingAuthority || undefined
      },
      employmentType: employmentType || 'full_time',
      hireDate: hireDate || new Date()
    });

    // Get company name for email
    const company = await Company.findById(req.companyId);

    // Send credentials email to driver
    await sendDriverCredentials({
      email,
      firstName,
      companyName: company.name,
      password: randomPassword
    });

    res.status(201).json({ 
      status: 'success', 
      message: 'Driver created successfully. Credentials sent to driver via email.',
      data: { driver } 
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }

    Object.assign(driver, req.body);
    await driver.save();

    res.json({ status: 'success', data: { driver } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }

    const activeTrip = await Trip.findOne({
      driverId: driver._id,
      status: { $in: ['dispatched', 'in_progress'] }
    });
    if (activeTrip) {
      return res.status(400).json({ status: 'error', message: 'Cannot delete driver with active trips' });
    }

    const tripCount = await Trip.countDocuments({ driverId: driver._id });
    if (tripCount > 0) {
      driver.status = 'terminated';
      driver.isActive = false;
      driver.terminationDate = new Date();
      await driver.save();
      return res.json({ status: 'success', message: 'Driver marked as terminated' });
    }

    await Driver.deleteOne({ _id: driver._id });
    res.json({ status: 'success', message: 'Driver deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDriverTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { driverId: req.params.id, companyId: req.companyId };
    if (status) query.status = status;

    const total = await Trip.countDocuments(query);
    const trips = await Trip.find(query)
      .populate('vehicleId', 'name licensePlate vehicleType')
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

export const getDriverPerformance = async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }

    const completionRate = driver.performance.totalTrips > 0
      ? (driver.performance.completedTrips / driver.performance.totalTrips) * 100
      : 0;

    res.json({
      status: 'success',
      data: {
        performance: driver.performance,
        safetyScore: driver.safetyScore,
        completionRate,
        incidents: driver.incidents
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateDriverSafetyScore = async (req, res) => {
  try {
    const { score, reason } = req.body;
    
    const driver = await Driver.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }

    driver.safetyScore.history.push({
      score: driver.safetyScore.current,
      date: new Date(),
      reason
    });
    driver.safetyScore.current = score;
    await driver.save();

    res.json({ status: 'success', data: { driver } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const addDriverIncident = async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }

    driver.incidents.push({
      date: new Date(),
      type: req.body.type,
      description: req.body.description,
      severity: req.body.severity,
      resolved: false
    });
    await driver.save();

    res.status(201).json({ status: 'success', data: { driver } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const driver = await Driver.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found' });
    }

    if (status === 'on_trip' && driver.status !== 'on_trip') {
      return res.status(400).json({ status: 'error', message: 'Cannot manually set driver to on_trip status' });
    }

    driver.status = status;
    await driver.save();

    res.json({ status: 'success', data: { driver } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
