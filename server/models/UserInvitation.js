import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userInvitationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'],
    default: 'driver'
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  acceptedAt: Date,
  message: String
}, {
  timestamps: true
});

// userInvitationSchema.index({ companyId: 1, email: 1 });
// userInvitationSchema.index({ token: 1 });
// userInvitationSchema.index({ status: 1, expiresAt: 1 });

userInvitationSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

export default mongoose.model('UserInvitation', userInvitationSchema);
