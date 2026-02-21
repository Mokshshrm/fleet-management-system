import mongoose from 'mongoose';

const maintenanceLogSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  maintenanceNumber: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['preventive', 'corrective', 'inspection', 'repair', 'emergency'],
    required: true
  },
  category: {
    type: String,
    enum: ['engine', 'transmission', 'brakes', 'tires', 'electrical', 'body', 'oil_change', 'general', 'other'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  schedule: {
    scheduledDate: {
      type: Date,
      required: true
    },
    startedAt: Date,
    completedAt: Date
  },
  odometer: {
    value: Number,
    unit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    }
  },
  serviceProvider: {
    type: {
      type: String,
      enum: ['internal', 'external']
    },
    name: String,
    contact: String,
    address: String
  },
  parts: [{
    name: {
      type: String,
      required: true
    },
    partNumber: String,
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    unitCost: Number,
    totalCost: Number,
    supplier: String
  }],
  labor: {
    hours: Number,
    hourlyRate: Number,
    totalCost: Number,
    technician: String
  },
  cost: {
    parts: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  warranty: {
    covered: {
      type: Boolean,
      default: false
    },
    validUntil: Date,
    provider: String
  },
  nextServiceDue: {
    date: Date,
    odometerValue: Number
  },
  notes: String,
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'report', 'photo', 'other']
    },
    url: String,
    uploadedAt: Date
  }],
  photos: [String],
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String
}, {
  timestamps: true
});

maintenanceLogSchema.index({ companyId: 1, vehicleId: 1 });
maintenanceLogSchema.index({ companyId: 1, status: 1 });
maintenanceLogSchema.index({ 'schedule.scheduledDate': 1 });
maintenanceLogSchema.index({ maintenanceNumber: 1 });

maintenanceLogSchema.pre('save', function(next) {
  this.cost.total = (this.cost.parts || 0) + (this.cost.labor || 0) + (this.cost.other || 0) + (this.cost.tax || 0);
  next();
});

maintenanceLogSchema.pre('save', async function(next) {
  if (this.isNew && !this.maintenanceNumber) {
    const count = await mongoose.model('MaintenanceLog').countDocuments({ companyId: this.companyId });
    this.maintenanceNumber = `MAINT-${Date.now()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('MaintenanceLog', maintenanceLogSchema);
