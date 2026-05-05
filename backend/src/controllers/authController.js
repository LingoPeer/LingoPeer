import { findUserByIdentifier, createUser } from '../models/User.js';
import { createExam } from '../models/Exam.js';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { getStaticPlacementQuestions } from '../data/staticPlacementExam.js';
import { toPublicExamQuestions } from '../utils/examPublic.js';
import { signAuthToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

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
    const existing = await findUserByIdentifier(candidate);
    if (!existing) return candidate;
    attempt += 1;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${base}_${suffix}`.slice(0, 30);
  }
  return `${base}_${Date.now().toString(36).slice(-6)}`.slice(0, 30);
}

export const loginUser = async (req, res) => {
  const { identifier, username, email, password } = req.body;

  const id = String(identifier ?? username ?? email ?? '').trim().toLowerCase();
  const safePassword = String(password ?? '').trim();

  if (!id || !safePassword) {
    return res.status(400).json({
      success: false,
      message: 'Email/username and password are required',
    });
  }

  const user = await findUserByIdentifier(id);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(safePassword, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = signAuthToken({ id: user.id, email: user.email });

  res.json({
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
};

export const registerUser = async (req, res) => {
  const rawName =
    req.body.fullName ?? req.body.name ?? req.body.username ?? '';
  const email = req.body.email ?? '';
  const password = req.body.password ?? '';

  const safeUsername = String(rawName).trim();
  const safeEmail = String(email).trim().toLowerCase();
  const safePassword = String(password).trim();

  if (!safeUsername || !safeEmail || !safePassword) {
    return res.status(400).json({
      success: false,
      message: 'Name (username), email, and password are required',
    });
  }

  const existingByEmail = await findUserByIdentifier(safeEmail);
  if (existingByEmail) {
    return res
      .status(409)
      .json({ success: false, message: 'User with that email already exists' });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(safePassword, saltRounds);
  const uniqueUsername = await ensureUniqueUsername(safeUsername);

  const newUser = await createUser({
    username: uniqueUsername,
    email: safeEmail,
    password: hashedPassword,
  });

  try {
    // Registration must be fast and reliable: always use static placement questions.
    // AI generation can be used later (after placement) without blocking onboarding.
    const rawQuestions = getStaticPlacementQuestions();
    const questions = normalizeExamQuestions(rawQuestions);

    const exam = await createExam({
      userId: newUser.id,
      title: 'AI Placement Exam',
      questions,
    });

    const token = signAuthToken({ id: newUser.id, email: newUser.email });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar || null,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        questions: toPublicExamQuestions(exam.questions),
      },
    });
  } catch (err) {
    logger.error('Registration exam generation failed', { message: err.message });
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [newUser.id]);
    } catch (delErr) {
      logger.error('Failed to roll back user after exam error', { message: delErr.message });
    }
    throw new AppError(
      'Could not finish registration (AI placement unavailable). Try again later.',
      503,
      'AI_UNAVAILABLE',
    );
  }
};
