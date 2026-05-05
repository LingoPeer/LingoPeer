import jwt from 'jsonwebtoken';
import { AppError } from './AppError.js';

export function signAuthToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Server misconfiguration: JWT_SECRET must be set', 500, 'CONFIG');
  }
  return jwt.sign(
    { userId: user.id, email: user.email },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

export function verifyAuthToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('Server misconfiguration', 500, 'CONFIG');
  return jwt.verify(token, secret);
}
