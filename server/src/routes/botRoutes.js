/**
 * @fileoverview Routes for the AI Bot interaction.
 * Handles chat messages and status checks.
 */
import { Router } from 'express';
import { BotController } from '../controllers/botController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

// POST /bot/chat - Send a message to the bot
router.post('/chat', BotController.chat);

// GET /bot/status - Check bot availability
router.get('/status', BotController.status);

export default router;
