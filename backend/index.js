// server.js
import 'dotenv/config'; 
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { startScan, getAllScans, getScanById, downloadPdf, saveDb, getSaveReports, saveReport, deleteSavedReport } from './controllers/scanController.js'; 

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors())
app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({limit:'10mb', extended:true}));


mongoose.connect( process.env.MONGO_URI ||
  'mongodb+srv://safvankp13:w5xr1zBu5IW5rMBW@learning.mdupztu.mongodb.net/Learning?retryWrites=true&w=majority&appName=Learning',
  {
    dbName: "Learning"
  }
)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


app.post('/api/scan', startScan);
app.post('/api/save',saveDb)
app.get('/api/allScans', getAllScans);
app.get('/api/scan/:id', getScanById);
app.get('/api/scan/:id/pdf', downloadPdf);
app.get('/api/saved-reports',getSaveReports)
app.post('/api/saved-reports',saveReport)
app.delete('/api/saved-reports/:id', deleteSavedReport); 
app.get("/ping", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("ok");
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));