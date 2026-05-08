const { db } = require('../services/firebase');

//  get all ratings
const getAllRatings = async (req, res) => {
  try {
    const snapshot = await db.collection('ratings').orderBy('createdAt', 'desc').get();
    const ratings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  get ratings for a specific lecturer
const getRatingsByLecturer = async (req, res) => {
  try {
    const snapshot = await db.collection('ratings')
      .where('lecturerEmail', '==', req.params.email).get();
    const ratings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const avg = ratings.length
      ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
      : null;

    res.json({ ratings, average: avg, count: ratings.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  grouped summary for PL/PRL
const getRatingsSummary = async (req, res) => {
  try {
    const snapshot = await db.collection('ratings').get();
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const map = {};
    all.forEach(r => {
      const key = r.lecturerEmail || 'unknown';
      if (!map[key]) {
        map[key] = { lecturerEmail: key, lecturerName: r.lecturerName || key, ratings: [] };
      }
      map[key].ratings.push(r);
    });

    const summary = Object.values(map).map(g => ({
      lecturerEmail: g.lecturerEmail,
      lecturerName: g.lecturerName,
      count: g.ratings.length,
      average: (g.ratings.reduce((s, r) => s + (r.rating || 0), 0) / g.ratings.length).toFixed(1),
      ratings: g.ratings,
    })).sort((a, b) => b.average - a.average);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  submit a rating
const submitRating = async (req, res) => {
  try {
    const {
      lecturerEmail, lecturerName, courseCode,
      rating, comment, studentEmail,
    } = req.body;

    const existing = await db.collection('ratings')
      .where('studentEmail', '==', studentEmail)
      .where('lecturerEmail', '==', lecturerEmail)
      .where('courseCode', '==', courseCode)
      .get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'You have already rated this lecturer for this course' });
    }

    const record = {
      lecturerEmail, lecturerName, courseCode,
      rating, comment: comment || '',
      studentEmail, createdAt: new Date(),
    };
    const docRef = await db.collection('ratings').add(record);
    res.status(201).json({ id: docRef.id, ...record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllRatings, getRatingsByLecturer, getRatingsSummary, submitRating,
};