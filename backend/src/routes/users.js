const express = require('express');
const router = express.Router();
const { getAllUsers, getLecturers, getStudents, getUserById } = require('../controllers/usersController');
const { verifyToken } = require('../services/authMiddleware');

router.get('/', verifyToken, getAllUsers);
router.get('/lecturers', verifyToken, getLecturers);
router.get('/students', verifyToken, getStudents);
router.get('/:id', verifyToken, getUserById);

module.exports = router;