import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['truck', 'van', 'bike', 'car', 'other'],
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  make: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1900,
    max: 2100
  },
  vin: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  maxLoadCapacity: {
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
  odometer: {
    current: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    },
    lastUpdated: Date
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'],
    default: 'diesel'
  },
  fuelCapacity: {
    value: Number,
    unit: {
      type: String,
      enum: ['liters', 'gallons'],
      default: 'liters'
    }
  },
  status: {
    type: String,
    enum: ['available', 'on_trip', 'in_shop', 'out_of_service', 'retired'],
    default: 'available',
    index: true
  },
  registration: {
    number: String,
    expiryDate: Date
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    premium: Number
  },
  acquisitionDate: Date,
  acquisitionCost: Number,
  currentValue: Number,
  region: {
    type: String,
    trim: true
  },
  notes: String,
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// vehicleSchema.index({ companyId: 1, status: 1 });
// vehicleSchema.index({ companyId: 1, vehicleType: 1 });
// vehicleSchema.index({ companyId: 1, licensePlate: 1 });
// vehicleSchema.index({ 'registration.expiryDate': 1 });
// vehicleSchema.index({ 'insurance.expiryDate': 1 });

vehicleSchema.virtual('isMaintenanceDue').get(function() {
  return this.status === 'in_shop';
});

vehicleSchema.virtual('isAvailableForTrip').get(function() {
  return this.status === 'available' && this.isActive;
});

export default mongoose.model('Vehicle', vehicleSchema);
