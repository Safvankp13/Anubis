// models/ScanResult.js
import mongoose from 'mongoose';

const ScanResultSchema = new mongoose.Schema({
    target: { type: String, required: true },
    url: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    result: { type: Object, required: true }
}, { timestamps: true });

export const ScanResult = mongoose.model('ScanResult', ScanResultSchema);