const { db } = require('../services/firebase');

const getAllSessions = async (req, res) => {
  try {
    const snapshot = await db.collection('attendanceSessions')
      .orderBy('createdAt', 'desc').get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
  } catch (error) {
    console.error('getAllSessions error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getOpenSessions = async (req, res) => {
  try {
    const snapshot = await db.collection('attendanceSessions')
      .where('isOpen', '==', true).get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
  } catch (error) {
    console.error('getOpenSessions error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getSessionsByLecturer = async (req, res) => {
  try {
    const snapshot = await db.collection('attendanceSessions')
      .where('lecturerEmail', '==', req.params.email).get();
    const sessions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());
    res.json(sessions);
  } catch (error) {
    console.error('getSessionsByLecturer error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const snapshot = await db.collection('studentAttendance')
      .where('studentId', '==', req.params.studentId).get();
    const records = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());
    res.json(records);
  } catch (error) {
    console.error('getStudentAttendance error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getSessionCheckIns = async (req, res) => {
  try {
    const snapshot = await db.collection('studentAttendance')
      .where('sessionId', '==', req.params.sessionId).get();
    const checkIns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(checkIns);
  } catch (error) {
    console.error('getSessionCheckIns error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const openSession = async (req, res) => {
  try {
    const { courseCode, lecturerEmail, lecturerName, date, venue } = req.body;

    if (!courseCode || !lecturerEmail || !lecturerName || !date) {
      return res.status(400).json({ error: 'Missing required fields: courseCode, lecturerEmail, lecturerName, date' });
    }

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
    console.error('openSession error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const closeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { presentCount, absentCount, totalStudents } = req.body;

    console.log('closeSession called — ID:', id);
    console.log('closeSession body:', req.body);

    if (!id) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    const sessionRef = db.collection('attendanceSessions').doc(id);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      console.error('closeSession: session not found —', id);
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!sessionSnap.data().isOpen) {
      return res.status(409).json({ error: 'Session is already closed' });
    }

    await sessionRef.update({
      isOpen: false,
      presentCount: presentCount ?? 0,
      absentCount: absentCount ?? 0,
      totalStudents: totalStudents ?? 0,
      closedAt: new Date(),
    });

    res.json({ message: 'Session closed successfully' });
  } catch (error) {
    console.error('closeSession error:', error.code, error.message);
    res.status(500).json({ error: error.message });
  }
};

const studentCheckIn = async (req, res) => {
  try {
    const {
      sessionId, studentId, studentEmail, studentName,
      courseCode, lecturerEmail, date, venue,
    } = req.body;

    if (!sessionId || !studentId || !studentEmail) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, studentId, studentEmail' });
    }

    const sessionSnap = await db.collection('attendanceSessions').doc(sessionId).get();
    if (!sessionSnap.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (!sessionSnap.data().isOpen) {
      return res.status(409).json({ error: 'Session is already closed' });
    }

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
    console.error('studentCheckIn error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllSessions, getOpenSessions, getSessionsByLecturer,
  getStudentAttendance, getSessionCheckIns,
  openSession, closeSession, studentCheckIn,
};