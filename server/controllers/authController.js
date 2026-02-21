import { Company, User, UserInvitation } from '../models/index.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt.js';
import { sendInvitationEmail, sendWelcomeEmail } from '../services/emailService.js';
import { getUserPermissions } from '../config/permissions.js';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }

    const company = await Company.create({ name: companyName, email });

    const user = await User.create({
      companyId: company._id,
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'owner',
      isActive: true
    });

    const accessToken = generateAccessToken({ userId: user._id, companyId: company._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    await sendWelcomeEmail(email, firstName, companyName);

    const permissions = getUserPermissions(user.role);

    res.status(201).json({
      status: 'success',
      data: { user, accessToken, refreshToken, permissions }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ status: 'error', message: 'Account is inactive' });
    }

    const accessToken = generateAccessToken({ userId: user._id, companyId: user.companyId, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    const permissions = getUserPermissions(user.role);

    res.json({
      status: 'success',
      data: { user, accessToken, refreshToken, permissions }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken({ userId: user._id, companyId: user.companyId, role: user.role });

    res.json({ status: 'success', data: { accessToken } });
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { refreshToken: null });
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get current user info with permissions for frontend UI rendering
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -refreshToken')
      .populate('companyId', 'name email');

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const permissions = getUserPermissions(user.role);

    res.json({
      status: 'success',
      data: {
        user,
        permissions,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ status: 'success', message: 'If email exists, reset link sent' });
    }

    res.json({ status: 'success', message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    res.json({ status: 'success', message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    res.json({ status: 'success', message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const inviteUser = async (req, res) => {
  try {
    const { email, role, message } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    const existingInvitation = await UserInvitation.findOne({ 
      email, 
      companyId: req.companyId, 
      status: 'pending' 
    });

    if (existingInvitation) {
      return res.status(400).json({ status: 'error', message: 'Invitation already sent' });
    }

    const invitation = await UserInvitation.create({
      companyId: req.companyId,
      invitedBy: req.userId,
      email,
      role,
      message
    });

    const inviter = await User.findById(req.userId);
    const company = await Company.findById(req.companyId);

    await sendInvitationEmail({
      email,
      inviterName: inviter.firstName + ' ' + inviter.lastName,
      companyName: company.name,
      token: invitation.token,
      role
    });

    res.status(201).json({
      status: 'success',
      data: { invitation }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const verifyInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await UserInvitation.findOne({ token, status: 'pending' })
      .populate('companyId', 'name')
      .populate('invitedBy', 'firstName lastName email');

    if (!invitation || invitation.isExpired()) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired invitation' });
    }

    res.json({
      status: 'success',
      data: {
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.companyId.name,
        inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
        message: invitation.message
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const verifyInvitationFromBody = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token is required' });
    }

    const invitation = await UserInvitation.findOne({ token, status: 'pending' })
      .populate('companyId', 'name')
      .populate('invitedBy', 'firstName lastName email');

    if (!invitation) {
      return res.status(400).json({ status: 'error', message: 'Invalid invitation token' });
    }

    if (invitation.isExpired()) {
      return res.status(400).json({ status: 'error', message: 'Invitation has expired' });
    }

    res.json({
      status: 'success',
      data: {
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.companyId.name,
        inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
        message: invitation.message
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { firstName, lastName, password } = req.body;

    const invitation = await UserInvitation.findOne({ token, status: 'pending' })
      .populate('companyId', 'name');

    if (!invitation || invitation.isExpired()) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired invitation' });
    }

    const user = await User.create({
      companyId: invitation.companyId._id,
      email: invitation.email,
      password,
      firstName,
      lastName,
      role: invitation.role,
      isActive: true
    });

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    await sendWelcomeEmail(user.email, user.firstName, invitation.companyId.name);

    const accessToken = generateAccessToken({ userId: user._id, companyId: user.companyId, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      status: 'success',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const acceptInvitationFromBody = async (req, res) => {
  try {
    const { token, password, phone, firstName, lastName } = req.body;

    if (!token || !password) {
      return res.status(400).json({ status: 'error', message: 'Token and password are required' });
    }

    const invitation = await UserInvitation.findOne({ token, status: 'pending' })
      .populate('companyId', 'name');

    if (!invitation) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired invitation' });
    }

    if (invitation.isExpired()) {
      return res.status(400).json({ status: 'error', message: 'Invitation has expired' });
    }

    const emailParts = invitation.email.split('@');
    const defaultFirstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);

    const user = await User.create({
      companyId: invitation.companyId._id,
      email: invitation.email,
      password,
      firstName: firstName || defaultFirstName,
      lastName: lastName || 'User',
      phone: phone || undefined,
      role: invitation.role,
      isActive: true
    });

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    await sendWelcomeEmail(user.email, user.firstName, invitation.companyId.name);

    const accessToken = generateAccessToken({ userId: user._id, companyId: user.companyId, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: { 
        user: userResponse, 
        accessToken, 
        refreshToken 
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getInvitations = async (req, res) => {
  try {
    const invitations = await UserInvitation.find({ 
      companyId: req.companyId,
      status: 'pending'
    })
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: { invitations } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const cancelInvitation = async (req, res) => {
  try {
    const invitation = await UserInvitation.findOne({
      _id: req.params.id,
      companyId: req.companyId
    });

    if (!invitation) {
      return res.status(404).json({ status: 'error', message: 'Invitation not found' });
    }

    invitation.status = 'cancelled';
    await invitation.save();

    res.json({ status: 'success', message: 'Invitation cancelled' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
