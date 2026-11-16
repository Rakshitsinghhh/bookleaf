import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { dbHelper } from '../database/db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'AuthenticationRequired',
      message: 'Access denied. Missing or invalid Authorization header.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'InvalidToken',
      message: 'Your session has expired or the token is invalid. Please log in again.'
    });
  }
}

export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${roles.join(' or ')}.`
      });
    }
    next();
  };
}

export function authorOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Not logged in' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  // If author, verify author_id matches
  const targetAuthorId = req.params.authorId || req.query.authorId || req.body.author_id;
  if (targetAuthorId && req.user.author_id !== targetAuthorId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Authors can only access their own books and tickets.'
    });
  }

  next();
}
