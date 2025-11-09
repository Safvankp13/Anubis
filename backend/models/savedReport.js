import mongoose from "mongoose";

const SavedReportSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "ScanResult" },
  domain: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const SavedReport = mongoose.model("SavedReport", SavedReportSchema);
