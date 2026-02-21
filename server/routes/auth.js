import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register',
  authController.register
);

router.post('/login',
  authController.login
);

router.post('/refresh-token',
  authController.refreshToken
);

router.post('/logout',
  authenticate,
  authController.logout
);

router.post('/forgot-password',
  authController.forgotPassword
);

router.post('/reset-password',
  authController.resetPassword
);

router.post('/verify-email',
  authController.verifyEmail
);

router.post('/invite',
  authenticate,
  requireRole('admin'),
  authController.inviteUser
);

router.get('/invitations',
  authenticate,
  requireRole('admin'),
  authController.getInvitations
);

router.post('/invitations/:token/accept',
  authController.acceptInvitation
);

router.delete('/invitations/:id',
  authenticate,
  requireRole('admin'),
  authController.cancelInvitation
);

export default router;
