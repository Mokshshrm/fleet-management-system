import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  fuelLogNumber: {
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
    index: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'],
    required: true
  },
  quantity: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['liters', 'gallons', 'kwh'],
      default: 'liters'
    }
  },
  cost: {
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  odometer: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    }
  },
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  station: {
    name: String,
    brand: String
  },
  fuelEfficiency: {
    value: Number,
    unit: {
      type: String,
      enum: ['km/l', 'miles/gal', 'l/100km']
    }
  },
  isFull: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'fleet_card', 'credit', 'other'],
    default: 'card'
  },
  receiptNumber: String,
  receiptImage: String,
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// fuelLogSchema.index({ companyId: 1, vehicleId: 1, date: -1 });
// fuelLogSchema.index({ companyId: 1, date: -1 });
// fuelLogSchema.index({ vehicleId: 1, date: -1 });

fuelLogSchema.pre('validate', function(next) {
  if (this.quantity.value && this.cost.pricePerUnit) {
    this.cost.total = this.quantity.value * this.cost.pricePerUnit;
  }
  next();
});

fuelLogSchema.pre('validate', function(next) {
  if (this.isNew && !this.fuelLogNumber) {
    this.fuelLogNumber = Date.now().toString();
  }
  next();
});

export default mongoose.model('FuelLog', fuelLogSchema);
