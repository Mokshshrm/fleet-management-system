import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  license: {
    number: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: [String],
      enum: ['car', 'van', 'truck', 'bike', 'commercial', 'heavy'],
      required: true
    },
    issueDate: Date,
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    issuingAuthority: String
  },
  status: {
    type: String,
    enum: ['on_duty', 'off_duty', 'on_trip', 'suspended', 'terminated'],
    default: 'off_duty',
    index: true
  },
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'temporary'],
    default: 'full_time'
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  terminationDate: Date,
  safetyScore: {
    current: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    history: [{
      score: Number,
      date: Date,
      reason: String
    }]
  },
  performance: {
    totalTrips: {
      type: Number,
      default: 0
    },
    completedTrips: {
      type: Number,
      default: 0
    },
    cancelledTrips: {
      type: Number,
      default: 0
    },
    totalDistance: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        enum: ['km', 'miles'],
        default: 'km'
      }
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  incidents: [{
    date: Date,
    type: {
      type: String,
      enum: ['accident', 'violation', 'complaint', 'other']
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  certifications: [{
    name: String,
    issueDate: Date,
    expiryDate: Date,
    issuingBody: String
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  salary: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    payPeriod: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly']
    }
  },
  notes: String,
  profileImage: String,
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// driverSchema.index({ companyId: 1, status: 1 });
// driverSchema.index({ companyId: 1, email: 1 });
// driverSchema.index({ 'license.expiryDate': 1 });

driverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

driverSchema.virtual('isLicenseValid').get(function() {
  return this.license.expiryDate > new Date();
});

driverSchema.virtual('isAvailableForTrip').get(function() {
  return this.status === 'off_duty' && this.isLicenseValid && this.isActive;
});

driverSchema.virtual('completionRate').get(function() {
  if (this.performance.totalTrips === 0) return 0;
  return (this.performance.completedTrips / this.performance.totalTrips) * 100;
});

driverSchema.methods.canDriveVehicleType = function(vehicleType) {
  const typeMapping = {
    'car': ['car', 'van'],
    'van': ['van', 'truck'],
    'truck': ['truck', 'commercial', 'heavy'],
    'bike': ['bike']
  };
  
  const requiredCategories = typeMapping[vehicleType] || [];
  return requiredCategories.some(cat => this.license.category.includes(cat));
};

export default mongoose.model('Driver', driverSchema);
