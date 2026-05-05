import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import pool from './src/config/db.js';
import { logger } from './src/utils/logger.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { AppError } from './src/utils/AppError.js';
import { authenticateToken } from './src/middlewares/authMiddleware.js';
import { apiLimiter, authLimiter, aiLimiter } from './src/middlewares/rateLimits.js';

import authRoutes from './src/routes/authRoutes.js';
import examRoutes from './src/routes/examRoutes.js';
import placementRoutes from './src/routes/placementRoutes.js';
import lessonRoutes from './src/routes/lessonRoutes.js';
import progressRoutes from './src/routes/progressRoutes.js';
import noteRoutes from './src/routes/noteRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import aiChatRoutes from './src/routes/aiChatRoutes.js';
import leaderboardRoutes from './src/routes/leaderboardRoutes.js';
import communityRoutes from './src/routes/communityRoutes.js';
import practiceRequestRoutes from './src/routes/practiceRequestRoutes.js';
import privateMessageRoutes from './src/routes/privateMessageRoutes.js';
import { Server as SocketIOServer } from 'socket.io';
import { initCommunitySocket } from './src/socket/communitySocket.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET is not set — set it in .env before production');
}

// Public auth (stricter rate limit)
app.use('/api/auth', authLimiter, authRoutes);

// Authenticated API
app.use('/api/exams', apiLimiter, authenticateToken, examRoutes);
app.use('/api/placement', apiLimiter, authenticateToken, placementRoutes);
app.use('/api/lessons', apiLimiter, authenticateToken, lessonRoutes);
app.use('/api/progress', apiLimiter, authenticateToken, progressRoutes);
app.use('/api/notes', apiLimiter, authenticateToken, noteRoutes);
app.use('/api/me', apiLimiter, authenticateToken, profileRoutes);
app.use('/api/notifications', apiLimiter, authenticateToken, notificationRoutes);
app.use('/api/ai', apiLimiter, authenticateToken, aiChatRoutes);
app.use('/api/leaderboard', apiLimiter, authenticateToken, leaderboardRoutes);
app.use('/api/community', apiLimiter, authenticateToken, communityRoutes);
app.use('/api/practice-requests', apiLimiter, authenticateToken, practiceRequestRoutes);
app.use('/api/private-messages', apiLimiter, authenticateToken, privateMessageRoutes);

app.get('/', (req, res) => {
  res.json({
    ok: true,
    name: 'AI English Platform API',
    docs: '/api/health',
  });
});

app.get('/api/health', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, database: true, time: result.rows[0].now });
  } catch (err) {
    next(err);
  }
});

(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection OK', { time: result.rows[0].now });
  } catch (err) {
    logger.error('Database connection failed', { message: err.message });
  }
})();

const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});
initCommunitySocket(io);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
  return errorHandler(err, req, res, next);
});

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
