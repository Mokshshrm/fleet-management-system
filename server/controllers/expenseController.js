import { Expense, Vehicle, Driver, Trip } from '../models/index.js';

export const getAllExpenses = async (req, res) => {
  try {
    const { category, status, vehicleId, driverId, tripId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.companyId };

    if (category) query.category = category;
    if (status) query.paymentStatus = status;
    if (vehicleId) query.vehicleId = vehicleId;
    if (driverId) query.driverId = driverId;
    if (tripId) query.tripId = tripId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('vehicleId', 'name licensePlate')
      .populate('driverId', 'firstName lastName')
      .populate('tripId', 'tripNumber')
      .populate('recordedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      status: 'success',
      data: {
        expenses,
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

export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('vehicleId')
      .populate('driverId')
      .populate('tripId')
      .populate('recordedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!expense) {
      return res.status(404).json({ status: 'error', message: 'Expense not found' });
    }
    res.json({ status: 'success', data: { expense } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { vehicleId, driverId, tripId } = req.body;

    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId: req.companyId });
      if (!vehicle) {
        return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
      }
    }

    if (driverId) {
      const driver = await Driver.findOne({ _id: driverId, companyId: req.companyId });
      if (!driver) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }
    }

    if (tripId) {
      const trip = await Trip.findOne({ _id: tripId, companyId: req.companyId });
      if (!trip) {
        return res.status(404).json({ status: 'error', message: 'Trip not found' });
      }
    }

    const expenseData = {
      ...req.body,
      companyId: req.companyId,
      recordedBy: req.userId
    };

    // Calculate totalAmount if not provided
    if (!expenseData.totalAmount && expenseData.amount !== undefined) {
      expenseData.totalAmount = expenseData.amount + (expenseData.tax || 0);
    }

    // Handle file uploads
    if (req.file) {
      // Single receipt file
      expenseData.receiptImage = `/uploads/expenses/${req.file.filename}`;
    } else if (req.files && req.files.length > 0) {
      // Multiple documents
      expenseData.documents = req.files.map(file => ({
        name: file.originalname,
        type: file.mimetype,
        url: `/uploads/expenses/${file.filename}`,
        uploadedAt: new Date()
      }));
    }

    const expense = await Expense.create(expenseData);

    // Populate and return
    const populatedExpense = await Expense.findById(expense._id)
      .populate('vehicleId', 'name licensePlate')
      .populate('driverId', 'firstName lastName')
      .populate('tripId', 'tripNumber')
      .populate('recordedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    res.status(201).json({ status: 'success', data: { expense: populatedExpense } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!expense) {
      return res.status(404).json({ status: 'error', message: 'Expense not found' });
    }

    if (expense.approvalStatus === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Cannot update approved expense' });
    }

    Object.assign(expense, req.body);
    await expense.save();

    res.json({ status: 'success', data: { expense } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!expense) {
      return res.status(404).json({ status: 'error', message: 'Expense not found' });
    }

    if (expense.approvalStatus === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Cannot delete approved expense' });
    }

    await Expense.deleteOne({ _id: expense._id });
    res.json({ status: 'success', message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!expense) {
      return res.status(404).json({ status: 'error', message: 'Expense not found' });
    }

    if (expense.approvalStatus === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Expense already approved' });
    }

    expense.approvalStatus = 'approved';
    expense.approvedBy = req.userId;
    expense.approvedAt = new Date();
    await expense.save();

    res.json({ status: 'success', data: { expense } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const rejectExpense = async (req, res) => {
  try {
    const { reason } = req.body;

    const expense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!expense) {
      return res.status(404).json({ status: 'error', message: 'Expense not found' });
    }

    if (expense.approvalStatus === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Cannot reject approved expense' });
    }

    expense.approvalStatus = 'rejected';
    expense.notes = reason || expense.notes;
    await expense.save();

    res.json({ status: 'success', data: { expense } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { companyId: req.companyId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query);

    const categoryBreakdown = {};
    expenses.forEach(expense => {
      const category = expense.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          totalAmount: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        };
      }
      categoryBreakdown[category].count++;
      categoryBreakdown[category].totalAmount += expense.totalAmount;
      if (expense.paymentStatus === 'pending') categoryBreakdown[category].pending++;
      if (expense.approvalStatus === 'approved') categoryBreakdown[category].approved++;
      if (expense.approvalStatus === 'rejected') categoryBreakdown[category].rejected++;
    });

    res.json({
      status: 'success',
      data: { categoryBreakdown }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getExpenseStats = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;
    const query = { companyId: req.companyId };

    if (vehicleId) query.vehicleId = vehicleId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query);

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
    const pending = expenses.filter(exp => exp.paymentStatus === 'pending').length;
    const approved = expenses.filter(exp => exp.approvalStatus === 'approved').length;
    const rejected = expenses.filter(exp => exp.approvalStatus === 'rejected').length;
    const billable = expenses.filter(exp => exp.isBillable).length;
    const recurring = expenses.filter(exp => exp.isRecurring).length;

    const approvedTotal = expenses
      .filter(exp => exp.approvalStatus === 'approved')
      .reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);

    const pendingTotal = expenses
      .filter(exp => exp.paymentStatus === 'pending')
      .reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);

    res.json({
      status: 'success',
      data: {
        totalExpenses,
        totalAmount: { value: totalAmount, currency: 'USD' },
        approvedAmount: { value: approvedTotal, currency: 'USD' },
        pendingAmount: { value: pendingTotal, currency: 'USD' },
        statusBreakdown: { pending, approved, rejected },
        billableExpenses: billable,
        recurringExpenses: recurring
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
