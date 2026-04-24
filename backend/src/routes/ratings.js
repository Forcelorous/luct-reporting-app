const express = require('express');
const router = express.Router();
const {
  getAllRatings, getRatingsByLecturer, getRatingsSummary, submitRating,
} = require('../controllers/ratingsController');
const { verifyToken } = require('../services/authMiddleware');

router.get('/', verifyToken, getAllRatings);
router.get('/summary', verifyToken, getRatingsSummary);
router.get('/lecturer/:email', verifyToken, getRatingsByLecturer);
router.post('/', verifyToken, submitRating);

module.exports = router;