import { OAuth2Client } from 'google-auth-library';
import pool from '../config/db.js';
import { signAuthToken } from '../utils/jwt.js';
import { findUserByEmail } from '../models/User.js';
import { logger } from '../utils/logger.js';
import { getStaticPlacementQuestions } from '../data/staticPlacementExam.js';
import { toPublicExamQuestions } from '../utils/examPublic.js';
import { createExam } from '../models/Exam.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function normalizeExamQuestions(raw) {
  return raw.map((q, i) => {
    let options = Array.isArray(q.options) ? q.options.map(String) : [];
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }
    options = options.slice(0, 4);
    const ci = Number.isFinite(q.correctIndex)
      ? q.correctIndex
      : parseInt(q.correctIndex, 10);
    const correctIndex = Math.min(3, Math.max(0, Number.isFinite(ci) ? ci : 0));
    return {
      id: String(q.id || `q${i + 1}`),
      section: String(q.section || 'Grammar'),
      prompt: String(q.prompt || ''),
      sentence: q.sentence != null ? String(q.sentence) : '',
      options,
      correctIndex,
    };
  });
}

async function ensureUniqueUsername(baseUsername) {
  const base = String(baseUsername || 'user')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 24) || 'user';

  let candidate = base;
  let attempt = 0;
  while (attempt < 20) {
    const { rows } = await pool.query(
      'SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [candidate],
    );
    if (rows.length === 0) return candidate;
    attempt += 1;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${base}_${suffix}`.slice(0, 30);
  }
  return `${base}_${Date.now().toString(36).slice(-6)}`.slice(0, 30);
}

export async function googleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({
      success: false,
      message: 'Google credential is required',
    });
  }

  try {
    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture || null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account email not available',
      });
    }

    // Check if user already exists by email
    let user = await findUserByEmail(email);

    if (!user) {
      // Create new user from Google data
      const uniqueUsername = await ensureUniqueUsername(name);
      // Generate a random secure password for Google users
      // This password is never used; they always log in via Google
      const randomPassword = `${googleId}_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;

      const { rows } = await pool.query(
        `INSERT INTO users (username, email, password, avatar)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, avatar, created_at`,
        [uniqueUsername, email.toLowerCase(), randomPassword, picture],
      );
      user = rows[0];

      // Create placement exam for new Google users
      try {
        const rawQuestions = getStaticPlacementQuestions();
        const questions = normalizeExamQuestions(rawQuestions);
        const exam = await createExam({
          userId: user.id,
          title: 'AI Placement Exam',
          questions,
        });

        const token = signAuthToken({ id: user.id, email: user.email });

        return res.status(201).json({
          success: true,
          message: 'Registration successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || null,
          },
          exam: {
            id: exam.id,
            title: exam.title,
            questions: toPublicExamQuestions(exam.questions),
          },
        });
      } catch (err) {
        logger.error('Google registration exam generation failed', { message: err.message });
        // Roll back user creation
        try {
          await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
        } catch (delErr) {
          logger.error('Failed to roll back Google user after exam error', { message: delErr.message });
        }
        return res.status(503).json({
          success: false,
          message: 'Could not finish registration (AI placement unavailable). Try again later.',
        });
      }
    }

    // Existing user — log them in
    const token = signAuthToken({ id: user.id, email: user.email });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    logger.error('Google login error', { message: error.message });
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed',
    });
  }
}
