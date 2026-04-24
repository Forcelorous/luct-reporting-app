const { db } = require('../services/firebase');

//  get all users (PL only)
const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get all lecturers
const getLecturers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'Lecturer').get();
    const lecturers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get all students
const getStudents = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'Student').get();
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get single user
const getUserById = async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllUsers, getLecturers, getStudents, getUserById };