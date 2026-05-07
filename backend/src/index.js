require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

//  Import firebase DB 
const { db } = require('./services/firebase');

const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');
const attendanceRoutes = require('./routes/attendance');
const ratingsRoutes = require('./routes/ratings');
const coursesRoutes = require('./routes/courses');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

//  Health check
app.get('/', (req, res) => {
  res.json({ message: 'LUCT Reporting API is running', version: '1.0.0' });
});

//  Test firebase route 
app.get('/test-firebase', async (req, res) => {
  console.log("🔥 /test-firebase route hit");
  try {
    const docRef = await db.collection('test').add({
      message: 'Firebase is connected!',
      time: new Date()
    });
    res.send(`✅ Firebase connected. Doc ID: ${docRef.id}`);
  } catch (error) {
    console.error("❌ Firebase error:", error);
    res.status(500).send('❌ Firebase NOT connected');
  }
});

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/courses', coursesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ Bind to 0.0.0.0 so devices on the same network can reach the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LUCT Backend running on http://localhost:${PORT}`);
  console.log(`✅ Network access: http://10.91.167.187:${PORT}`);
});

module.exports = app;