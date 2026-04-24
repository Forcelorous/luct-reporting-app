const express = require('express');
const router = express.Router();
const {
  getAllCourses, addCourse, deleteCourse,
  getAllAssignments, getAssignmentsByLecturer, assignLecturer, deleteAssignment,
} = require('../controllers/coursesController');
const { verifyToken } = require('../services/authMiddleware');

// Courses
router.get('/', verifyToken, getAllCourses);
router.post('/', verifyToken, addCourse);
router.delete('/:id', verifyToken, deleteCourse);

// Assignments
router.get('/assignments', verifyToken, getAllAssignments);
router.get('/assignments/lecturer/:email', verifyToken, getAssignmentsByLecturer);
router.post('/assignments', verifyToken, assignLecturer);
router.delete('/assignments/:id', verifyToken, deleteAssignment);

module.exports = router;