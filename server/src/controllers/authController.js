import { AuthService } from '../services/authService.js';

export const AuthController = {
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

  async logout(req, res, next) {
    try {
      const result = await AuthService.logout();
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

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
