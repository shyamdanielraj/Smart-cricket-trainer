import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const uploadRouter = Router();

/**
 * Vercel serverless has a writable temp directory at /tmp only.
 * For local/dev, keep using the repo-level uploads folder.
 */
const isVercel = !!process.env.VERCEL;

const uploadDir = isVercel
  ? path.join('/tmp', 'uploads')
  : path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), '..', 'uploads'));

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}__${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

uploadRouter.post('/file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  return res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});
