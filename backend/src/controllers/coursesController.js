const { db } = require('../services/firebase');

// get all courses 
const getAllCourses = async (req, res) => {
  try {
    const [coursesSnap, assignmentsSnap] = await Promise.all([
      db.collection('courses').get(),
      db.collection('assignments').get(),
    ]);

    const assignments = {};
    assignmentsSnap.docs.forEach(doc => {
      const data = doc.data();
      assignments[data.courseCode] = {
        lecturerName: data.lecturerName,
        lecturerEmail: data.lecturerEmail,
        uid: data.lecturerUid || '',
      };
    });

    const courses = coursesSnap.docs.map(doc => {
      const data = doc.data();
      const assigned = assignments[data.courseCode] || null;
      return {
        id: doc.id,
        ...data,
        assignedLecturer: assigned ? {
          name: assigned.lecturerName,
          email: assigned.lecturerEmail,
          uid: assigned.uid,
        } : null,
      };
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// add a course
const addCourse = async (req, res) => {
  try {
    const { courseCode, courseName, stream, faculty, totalStudents, scheduledTime, venue } = req.body;
    const course = {
      courseCode,
      courseName,
      stream: stream || '',
      faculty: faculty || '',
      totalStudents: totalStudents || '',
      scheduledTime: scheduledTime || '',
      venue: venue || '',
      createdAt: new Date(),
    };
    const docRef = await db.collection('courses').add(course);
    res.status(201).json({ id: docRef.id, ...course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE courses
const deleteCourse = async (req, res) => {
  try {
    await db.collection('courses').doc(req.params.id).delete();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get all assignments
const getAllAssignments = async (req, res) => {
  try {
    const snapshot = await db.collection('assignments').orderBy('assignedAt', 'desc').get();
    const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /assignments/lecturer
const getAssignmentsByLecturer = async (req, res) => {
  try {
    const snapshot = await db.collection('assignments')
      .where('lecturerEmail', '==', req.params.email).get();
    const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// assign lecturer to course
const assignLecturer = async (req, res) => {
  try {
    const { lecturerEmail, lecturerName, courseCode, lecturerUid } = req.body;

    const existing = await db.collection('assignments')
      .where('lecturerEmail', '==', lecturerEmail)
      .where('courseCode', '==', courseCode)
      .get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'Lecturer already assigned to this course' });
    }

    const assignment = {
      lecturerEmail,
      lecturerName,
      lecturerUid: lecturerUid || '',
      courseCode,
      assignedAt: new Date(),
    };
    const docRef = await db.collection('assignments').add(assignment);
    res.status(201).json({ id: docRef.id, ...assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /assignments/:id
const deleteAssignment = async (req, res) => {
  try {
    await db.collection('assignments').doc(req.params.id).delete();
    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllCourses, addCourse, deleteCourse,
  getAllAssignments, getAssignmentsByLecturer, assignLecturer, deleteAssignment,
};