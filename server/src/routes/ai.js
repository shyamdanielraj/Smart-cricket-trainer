import { Router } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { requireAuth } from '../middleware/auth.js';
import { Prediction } from '../models/Prediction.js';

export const aiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function countsFromPredictions(predictions) {
  const counts = {};
  for (const p of predictions) counts[p] = (counts[p] || 0) + 1;
  let mostFrequent = '';
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      max = v;
      mostFrequent = k;
    }
  }
  return { counts, mostFrequent };
}

aiRouter.post(
  '/predict',
  requireAuth,
  upload.fields([
    { name: 'dataset', maxCount: 1 },
    { name: 'model', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
      const datasetFile = req.files?.dataset?.[0];
      const modelFile = req.files?.model?.[0];

      if (!datasetFile) return res.status(400).json({ error: 'Dataset file is required' });

      const form = new FormData();
      form.append('datafile', datasetFile.buffer, {
        filename: datasetFile.originalname,
        contentType: datasetFile.mimetype,
      });
      if (modelFile) {
        form.append('modelfile', modelFile.buffer, {
          filename: modelFile.originalname,
          contentType: modelFile.mimetype,
        });
      }

      const resp = await axios.post(`${pythonUrl}/predict`, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      });

      if (resp.status >= 400) {
        return res.status(resp.status).json(resp.data);
      }

      const predictions = resp.data?.predictions;
      if (!Array.isArray(predictions)) {
        return res.status(502).json({ error: 'Bad response from ML service' });
      }

      const { counts, mostFrequent } = countsFromPredictions(predictions);
      const datasetName = datasetFile.originalname || '';
      const modelName = modelFile?.originalname || '';

      const doc = await Prediction.create({
        userId: req.user.sub,
        datasetName,
        modelName,
        predictions,
        counts,
        mostFrequent,
      });

      return res.json({
        id: String(doc._id),
        predictions,
        counts,
        mostFrequent,
      });
    } catch (err) {
      return next(err);
    }
  },
);

aiRouter.post(
  '/predict-frame',
  requireAuth,
  upload.single('frame'),
  async (req, res, next) => {
    try {
      const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
      if (!req.file?.buffer) {
        return res.status(400).json({ error: 'Camera frame is required (multipart field: frame)' });
      }

      const form = new FormData();
      form.append('image', req.file.buffer, {
        filename: req.file.originalname || 'frame.jpg',
        contentType: req.file.mimetype || 'image/jpeg',
      });

      const sessionId = req.headers['x-session-id'] || 'default';

      const resp = await axios.post(`${pythonUrl}/predict_frame`, form, {
        headers: {
          ...form.getHeaders(),
          'X-Session-Id': String(sessionId).slice(0, 128),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
        timeout: 60000,
      });

      if (resp.status >= 400) {
        const body = resp.data;
        if (typeof body === 'string') {
          return res.status(resp.status).json({ error: body.slice(0, 500) });
        }
        return res.status(resp.status).json(body);
      }
      return res.json(resp.data);
    } catch (err) {
      const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
      const code = err.code || err.cause?.code;
      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
        return res.status(502).json({
          error: 'ML service is not reachable',
          details: `Start Flask from python-service: python app.py (expected at ${pythonUrl})`,
        });
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return res.status(504).json({
          error: 'ML service timed out',
          details: 'Pose inference took too long — try again or reduce camera resolution.',
        });
      }
      return next(err);
    }
  },
);

/**
 * Save aggregated webcam session (optional — call when user stops camera).
 */
aiRouter.post('/live-session', requireAuth, async (req, res, next) => {
  try {
    const shots = req.body?.shots;
    if (!Array.isArray(shots) || shots.length === 0) {
      return res.status(400).json({ error: 'Body must include a non-empty shots array' });
    }
    const asStrings = shots.map((s) => String(s));
    const { counts, mostFrequent } = countsFromPredictions(asStrings);

    const doc = await Prediction.create({
      userId: req.user.sub,
      datasetName: 'webcam-live',
      modelName: 'mediapipe-pose',
      predictions: asStrings,
      counts,
      mostFrequent,
    });

    return res.json({
      id: String(doc._id),
      counts,
      mostFrequent,
    });
  } catch (err) {
    return next(err);
  }
});

aiRouter.get('/history', requireAuth, async (req, res, next) => {
  try {
    const items = await Prediction.find({ userId: req.user.sub })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({
      items: items.map((i) => ({
        id: String(i._id),
        createdAt: i.createdAt,
        datasetName: i.datasetName,
        modelName: i.modelName,
        mostFrequent: i.mostFrequent,
        counts: i.counts,
      })),
    });
  } catch (err) {
    return next(err);
  }
});

