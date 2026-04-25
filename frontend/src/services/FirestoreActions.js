// src/services/FirestoreActions.js
import { firestore } from './FirebaseConfig';
import { COLLECTIONS } from '../utils/constants';

// Add a new report
export const addReport = async (report) => {
  return await firestore.collection(COLLECTIONS.REPORTS).add({
    ...report,
    createdAt: new Date()
  });
};

// Get all reports
export const getReportsByLecturer = async (lecturerUID) => {
  try {
    const q = query(
      collection(db, 'reports'),
      where('lecturerUID', '==', lecturerUID)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('getReportsByLecturer error:', error);
    return [];
  }
};

// Add attendance record
export const addAttendance = async (record) => {
  return await firestore.collection(COLLECTIONS.ATTENDANCE).add({
    ...record,
    createdAt: new Date()
  });
};

// Get attendance records
export const getAttendance = async () => {
  const snapshot = await firestore.collection(COLLECTIONS.ATTENDANCE).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Submit feedback
export const addFeedback = async (feedback) => {
  return await firestore.collection(COLLECTIONS.FEEDBACK).add({
    feedback,
    createdAt: new Date()
  });
};
