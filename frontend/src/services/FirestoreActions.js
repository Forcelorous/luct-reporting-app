import { db } from './FirebaseConfig';
import { COLLECTIONS } from '../utils/constants';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Add a new report
export const addReport = async (report) => {
  return await addDoc(collection(db, COLLECTIONS.REPORTS), {
    ...report,
    createdAt: new Date()
  });
};

// Get all reports by lecturer
export const getReportsByLecturer = async (lecturerUID) => {
  try {
    const q = query(collection(db, COLLECTIONS.REPORTS), where('lecturerUID', '==', lecturerUID));
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
  return await addDoc(collection(db, COLLECTIONS.ATTENDANCE), {
    ...record,
    createdAt: new Date()
  });
};

// Get attendance records
export const getAttendance = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Submit feedback
export const addFeedback = async (feedback) => {
  return await addDoc(collection(db, COLLECTIONS.FEEDBACK), {
    feedback,
    createdAt: new Date()
  });
};
