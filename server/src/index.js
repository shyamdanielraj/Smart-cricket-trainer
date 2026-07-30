import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDb } from './lib/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { aiRouter } from './routes/ai.js';
import { uploadRouter } from './routes/upload.js';

dotenv.config();

const app = express();

/** Allow listed origins; in dev also mirror localhost ↔ 127.0.0.1 */
function corsOrigin(origin, callback) {
  const raw = process.env.CLIENT_ORIGIN;
  const allowedList = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (!origin) return callback(null, true);
  if (allowedList.length === 0) return callback(null, true);
  if (allowedList.includes(origin)) return callback(null, true);

  try {
    const u = new URL(origin);
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    const altHost =
      u.hostname === 'localhost'
        ? '127.0.0.1'
        : u.hostname === '127.0.0.1'
        ? 'localhost'
        : null;

    if (altHost) {
      const alt = `${u.protocol}//${altHost}:${port}`;
      if (allowedList.includes(alt)) return callback(null, true);
    }
  } catch {}

  return callback(new Error(`CORS blocked for origin: ${origin}`));
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

/** Health check */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/** Routes */
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/upload', uploadRouter);

/** Optional static serving */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));

  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) =>
      err ? next(err) : undefined
    );
  });
}

app.use(errorHandler);

/** 🔥 CRITICAL FIX FOR VERCEL */
await connectDb(process.env.MONGODB_URI);

export default app;
