import { verifyAccessToken } from '../config/jwt.js';
import { User } from '../models/index.js';
import { hasRole } from '../config/roles.js';

export const authenticate = async (req, res, next) => {
  try {

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const decoded = verifyAccessToken(token);
    
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;
    req.role = decoded.role;
    
    console.log("===============")
    console.log("Request Api  :  ", req.protocol + '://' + req.get('host') + req.originalUrl)
    console.log("Request Body :  ", req.body)
    console.log("===============")

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!hasRole(req.role, requiredRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};
