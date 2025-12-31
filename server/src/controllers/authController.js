import { AuthService } from '../services/authService.js';

export const AuthController = {
  async login(req, res, next) {
    try {
      const { username, password, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ error: 'username, password, role are required' });
      }

      const result = await AuthService.login(username, password, role);
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

  async logout(req, res, next) {
    try {
      const result = await AuthService.logout();
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
