import jwt from 'jsonwebtoken';

/**
 * Verifies `Authorization: Bearer <token>` and sets `req.user = { id, email }`.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'Server misconfiguration' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const id = decoded.userId ?? decoded.sub;
    if (!id) {
      return res.status(403).json({ success: false, message: 'Invalid token payload' });
    }
    req.user = { id, email: decoded.email };
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}