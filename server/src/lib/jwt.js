import jwt from 'jsonwebtoken';

export function signJwt(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET in server/.env');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyJwt(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET in server/.env');
  return jwt.verify(token, secret);
}

