/**
 * @fileoverview Authentication routes for user login, registration, and session management.
 */
import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

// POST /auth/login - Authenticate user and return token
router.post('/login', AuthController.login);
// POST /auth/refresh - Refresh access token using refresh token
router.post('/refresh', AuthController.refresh);
// GET /auth/me - Get current user details
router.get('/me', AuthController.me);
// POST /auth/logout - Logout user (invalidate session)
router.post('/logout', AuthController.logout);
// POST /auth/register - Register a new user
router.post('/register', AuthController.register);

export default router;
