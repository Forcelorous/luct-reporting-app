const express = require('express');
const router = express.Router();
const {
  getAllSessions, getOpenSessions, getSessionsByLecturer,
  getStudentAttendance, getSessionCheckIns,
  openSession, closeSession, studentCheckIn,
} = require('../controllers/attendanceController');
const { verifyToken } = require('../services/authMiddleware');

router.get('/sessions', verifyToken, getAllSessions);
router.get('/sessions/open', verifyToken, getOpenSessions);
router.get('/sessions/lecturer/:email', verifyToken, getSessionsByLecturer);
router.get('/session/:sessionId/checkins', verifyToken, getSessionCheckIns);
router.get('/student/:studentId', verifyToken, getStudentAttendance);
router.post('/sessions', verifyToken, openSession);
router.patch('/sessions/:id/close', verifyToken, closeSession);
router.post('/checkin', verifyToken, studentCheckIn);

module.exports = router;