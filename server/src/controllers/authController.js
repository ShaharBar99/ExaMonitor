import { AuthService } from '../services/authService.js';

/**
 * Controller for authentication endpoints.
 */
export const AuthController = {
  /**
   * Handles user login.
   */
  async login(req, res, next) {
    try {
      const { username, password, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ error: 'username, password, role are required' });
      }

      const forwarded = req.headers["x-forwarded-for"];
      const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") ||
        req.socket?.remoteAddress ||
        req.ip;

      const result = await AuthService.login(username, password, role, { ip });
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Gets the current authenticated user.
   */
  async me(req, res, next) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : null;

      if (!token) {
        return res.status(401).json({ error: 'Missing Bearer token' });
      }

      const result = await AuthService.getMe(token);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Refreshes the access token.
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required' });
      }

      const result = await AuthService.refreshToken(refreshToken);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Logs out the user.
   */
  async logout(req, res, next) {
    try {
      const result = await AuthService.logout();
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Registers a new user.
   */
  async register(req, res, next) {
    try {
      const { name, username, email, password, role } = req.body;
      if (!name || !username || !password || !role) {
        return res.status(400).json({ error: 'name, username, password, role are required' });
      }

      const result = await AuthService.register(name, username, email, password, role);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
};
