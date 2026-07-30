import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signJwt } from '../lib/jwt.js';

export const authRouter = Router();

const signupSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  login: z.string().min(3).max(128),
  password: z.string().min(8).max(128),
});

authRouter.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = signupSchema.parse(req.body);
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(409).json({ error: 'Username or email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash });
    const token = signJwt({ sub: String(user._id), username: user.username, email: user.email });

    return res.json({
      token,
      user: { id: String(user._id), username: user.username, email: user.email },
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { login, password } = loginSchema.parse(req.body);
    const user = await User.findOne({
      $or: [{ username: login }, { email: login.toLowerCase() }],
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signJwt({ sub: String(user._id), username: user.username, email: user.email });
    return res.json({
      token,
      user: { id: String(user._id), username: user.username, email: user.email },
    });
  } catch (err) {
    return next(err);
  }
});

