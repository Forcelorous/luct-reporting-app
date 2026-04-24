const express = require('express');
const router = express.Router();
const {
  getAllReports, getReportsByLecturer, getReportById,
  createReport, addFeedback, deleteReport,
} = require('../controllers/reportsController');
const { verifyToken } = require('../services/authMiddleware');

router.get('/', verifyToken, getAllReports);
router.get('/lecturer/:email', verifyToken, getReportsByLecturer);
router.get('/:id', verifyToken, getReportById);
router.post('/', verifyToken, createReport);
router.patch('/:id/feedback', verifyToken, addFeedback);
router.delete('/:id', verifyToken, deleteReport);

module.exports = router;