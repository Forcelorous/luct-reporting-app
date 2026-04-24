const { db } = require('../services/firebase');

//  get all reports
const getAllReports = async (req, res) => {
  try {
    const snapshot = await db.collection('reports').orderBy('createdAt', 'desc').get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get reports by lecturer
const getReportsByLecturer = async (req, res) => {
  try {
    const snapshot = await db.collection('reports')
      .where('lecturerEmail', '==', req.params.email)
      .orderBy('createdAt', 'desc')
      .get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get single report
const getReportById = async (req, res) => {
  try {
    const doc = await db.collection('reports').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Report not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  create report
const createReport = async (req, res) => {
  try {
    const {
      facultyName, className, weekOfReporting, dateOfLecture,
      courseName, courseCode, lecturerName, lecturerEmail,
      actualStudentsPresent, totalRegisteredStudents,
      venue, scheduledTime, topicTaught, learningOutcomes,
      recommendations,
    } = req.body;

    const report = {
      facultyName, className, weekOfReporting, dateOfLecture,
      courseName, courseCode, lecturerName, lecturerEmail,
      actualStudentsPresent, totalRegisteredStudents,
      venue, scheduledTime, topicTaught, learningOutcomes,
      recommendations,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('reports').add(report);
    res.status(201).json({ id: docRef.id, ...report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  PRL adds feedback
const addFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    await db.collection('reports').doc(req.params.id).update({
      feedback,
      feedbackAt: new Date(),
      feedbackBy: req.user?.email || 'PRL',
    });
    res.json({ message: 'Feedback added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE reports/:id
const deleteReport = async (req, res) => {
  try {
    await db.collection('reports').doc(req.params.id).delete();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllReports, getReportsByLecturer, getReportById,
  createReport, addFeedback, deleteReport,
};