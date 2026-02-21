import express from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';
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

router.get('/me',
  authenticate,
  authController.getCurrentUser
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
  requirePermission('CREATE_USER'),
  authController.inviteUser
);

router.get('/invitations',
  authenticate,
  requirePermission('VIEW_USERS'),
  authController.getInvitations
);

router.get('/invitations/:token/verify',
  authController.verifyInvitation
);

router.post('/verify-invitation',
  authController.verifyInvitationFromBody
);

router.post('/invitations/:token/accept',
  authController.acceptInvitation
);

router.post('/accept-invitation',
  authController.acceptInvitationFromBody
);

router.delete('/invitations/:id',
  authenticate,
  requirePermission('DELETE_USER'),
  authController.cancelInvitation
);

export default router;
