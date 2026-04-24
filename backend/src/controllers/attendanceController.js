const { db } = require('../services/firebase');

//  get all sessions
const getAllSessions = async (req, res) => {
  try {
    const snapshot = await db.collection('attendanceSessions')
      .orderBy('createdAt', 'desc').get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get open sessions
const getOpenSessions = async (req, res) => {
  try {
    const snapshot = await db.collection('attendanceSessions')
      .where('isOpen', '==', true).get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /attendance/sessions/lecturer/:email
const getSessionsByLecturer = async (req, res) => {
  try {
    const snapshot = await db.collection('attendanceSessions')
      .where('lecturerEmail', '==', req.params.email).get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get student attendance records
const getStudentAttendance = async (req, res) => {
  try {
    const snapshot = await db.collection('studentAttendance')
      .where('studentId', '==', req.params.studentId).get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get check-ins for a session
const getSessionCheckIns = async (req, res) => {
  try {
    const snapshot = await db.collection('studentAttendance')
      .where('sessionId', '==', req.params.sessionId).get();
    const checkIns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(checkIns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  open a new session
const openSession = async (req, res) => {
  try {
    const { courseCode, lecturerEmail, lecturerName, date, venue } = req.body;
    const session = {
      courseCode, lecturerEmail, lecturerName,
      date, venue: venue || '',
      isOpen: true,
      presentCount: 0,
      createdAt: new Date(),
    };
    const docRef = await db.collection('attendanceSessions').add(session);
    res.status(201).json({ id: docRef.id, ...session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  close a session
const closeSession = async (req, res) => {
  try {
    const { presentCount, absentCount, totalStudents } = req.body;
    await db.collection('attendanceSessions').doc(req.params.id).update({
      isOpen: false,
      presentCount,
      absentCount,
      totalStudents,
      closedAt: new Date(),
    });
    res.json({ message: 'Session closed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  student signs in
const studentCheckIn = async (req, res) => {
  try {
    const {
      sessionId, studentId, studentEmail, studentName,
      courseCode, lecturerEmail, date, venue,
    } = req.body;

    // Prevent duplicate check-in
    const existing = await db.collection('studentAttendance')
      .where('sessionId', '==', sessionId)
      .where('studentId', '==', studentId)
      .get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'Already checked in for this session' });
    }

    const record = {
      sessionId, studentId, studentEmail, studentName,
      courseCode, lecturerEmail, date, venue: venue || '',
      present: true, createdAt: new Date(),
    };
    const docRef = await db.collection('studentAttendance').add(record);
    res.status(201).json({ id: docRef.id, ...record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllSessions, getOpenSessions, getSessionsByLecturer,
  getStudentAttendance, getSessionCheckIns,
  openSession, closeSession, studentCheckIn,
};