import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  expenseNumber: {
    type: String,
    unique: true,
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    index: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    index: true
  },
  category: {
    type: String,
    enum: [
      'fuel',
      'maintenance',
      'repair',
      'insurance',
      'registration',
      'toll',
      'parking',
      'fine',
      'salary',
      'cleaning',
      'tire',
      'parts',
      'permit',
      'other'
    ],
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'cheque', 'fleet_card', 'credit', 'other'],
    default: 'card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'paid',
    index: true
  },
  vendor: {
    name: String,
    contact: String,
    email: String,
    phone: String
  },
  invoiceNumber: String,
  invoiceDate: Date,
  dueDate: Date,
  paidDate: Date,
  receiptNumber: String,
  receiptImage: String,
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    startDate: Date,
    endDate: Date,
    nextDate: Date
  },
  isBillable: {
    type: Boolean,
    default: false
  },
  billedTo: {
    customerId: String,
    customerName: String,
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    }
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  notes: String,
  tags: [String],
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// expenseSchema.index({ companyId: 1, date: -1 });
// expenseSchema.index({ companyId: 1, category: 1 });
// expenseSchema.index({ companyId: 1, vehicleId: 1, date: -1 });
// expenseSchema.index({ companyId: 1, paymentStatus: 1 });
// expenseSchema.index({ expenseNumber: 1 });

expenseSchema.pre('save', function(next) {
  if (this.amount !== undefined) {
    this.totalAmount = this.amount + (this.tax || 0);
  }
  next();
});

expenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expenseNumber) {
    const count = await mongoose.model('Expense').countDocuments({ companyId: this.companyId });
    this.expenseNumber = `EXP-${Date.now()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Expense', expenseSchema);
