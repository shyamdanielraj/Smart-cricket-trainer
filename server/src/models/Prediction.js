import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
    datasetName: { type: String, default: '' },
    modelName: { type: String, default: '' },
    predictions: { type: [String], required: true },
    counts: { type: Object, required: true },
    mostFrequent: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Prediction = mongoose.model('Prediction', predictionSchema);

