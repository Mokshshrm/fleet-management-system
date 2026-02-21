import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  tripNumber: {
    type: String,
    unique: true,
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'dispatched', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  cargo: {
    description: {
      type: String,
      required: true
    },
    weight: {
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['kg', 'tons', 'lbs'],
        default: 'kg'
      }
    },
    quantity: Number,
    value: Number,
    type: String
  },
  origin: {
    name: String,
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String
  },
  destination: {
    name: String,
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String
  },
  schedule: {
    plannedDepartureTime: {
      type: Date,
      required: true
    },
    plannedArrivalTime: Date,
    actualDepartureTime: Date,
    actualArrivalTime: Date
  },
  odometer: {
    start: Number,
    end: Number,
    unit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    }
  },
  distance: {
    planned: Number,
    actual: Number,
    unit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    }
  },
  revenue: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  expenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  }],
  notes: String,
  customerInfo: {
    name: String,
    company: String,
    email: String,
    phone: String,
    reference: String
  },
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'pod', 'manifest', 'other']
    },
    url: String,
    uploadedAt: Date
  }],
  proofOfDelivery: {
    signature: String,
    recipientName: String,
    receivedAt: Date,
    photos: [String],
    notes: String
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date
}, {
  timestamps: true
});

tripSchema.index({ companyId: 1, status: 1 });
tripSchema.index({ companyId: 1, vehicleId: 1 });
tripSchema.index({ companyId: 1, driverId: 1 });
tripSchema.index({ 'schedule.plannedDepartureTime': 1 });
tripSchema.index({ tripNumber: 1 });

tripSchema.virtual('actualDistance').get(function() {
  if (this.odometer.start && this.odometer.end) {
    return this.odometer.end - this.odometer.start;
  }
  return null;
});

tripSchema.virtual('duration').get(function() {
  if (this.schedule.actualDepartureTime && this.schedule.actualArrivalTime) {
    return this.schedule.actualArrivalTime - this.schedule.actualDepartureTime;
  }
  return null;
});

tripSchema.virtual('isDelayed').get(function() {
  if (this.schedule.plannedArrivalTime && this.schedule.actualArrivalTime) {
    return this.schedule.actualArrivalTime > this.schedule.plannedArrivalTime;
  }
  return false;
});

tripSchema.pre('save', async function(next) {
  if (this.isNew && !this.tripNumber) {
    const count = await mongoose.model('Trip').countDocuments({ companyId: this.companyId });
    this.tripNumber = `TRIP-${Date.now()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Trip', tripSchema);
