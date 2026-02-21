import jwt from 'jsonwebtoken';

export const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const generateInvitationToken = () => {
  return jwt.sign(
    { type: 'invitation' },
    process.env.JWT_INVITATION_SECRET || process.env.JWT_ACCESS_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyInvitationToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_INVITATION_SECRET || process.env.JWT_ACCESS_SECRET
    );
  } catch (error) {
    throw new Error('Invalid invitation token');
  }
};
