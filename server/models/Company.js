import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  settings: {
    maxVehicles: {
      type: Number,
      default: 10
    },
    maxDrivers: {
      type: Number,
      default: 10
    },
    maxUsers: {
      type: Number,
      default: 5
    },
    features: {
      analytics: {
        type: Boolean,
        default: false
      },
      reporting: {
        type: Boolean,
        default: false
      },
      advancedTracking: {
        type: Boolean,
        default: false
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

companySchema.index({ email: 1 });
companySchema.index({ 'subscription.status': 1 });

export default mongoose.model('Company', companySchema);
