import { verifyJwt } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }
    const payload = verifyJwt(token);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

