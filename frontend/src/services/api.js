import { auth } from './FirebaseConfig';

// ✅ Your PC's local WiFi IP — update this if IP changes (run ipconfig to check)
const BASE_URL = 'http://10.203.157.187:5000/api';


// ✅ Get a fresh Firebase token (true = force refresh if expired)
const getToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken(true);
};

// ✅ Safe JSON parser — catches HTML error pages or server crashes
const parseResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server returned non-JSON response: ${text.slice(0, 120)}`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
};

// ✅ Authenticated fetch — attaches Bearer token
const apiFetch = async (endpoint, options = {}) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return parseResponse(res);
};

// ✅ Public fetch — no token, used for /courses during registration
export const publicFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return parseResponse(res);
};

// USERS
export const getUsers = () => apiFetch('/users');
export const getLecturers = () => apiFetch('/users/lecturers');
export const getStudents = () => apiFetch('/users/students');
export const getUserById = (id) => apiFetch(`/users/${id}`);

// REPORTS
export const getAllReports = () => apiFetch('/reports');
export const getReportsByLecturer = (email) => apiFetch(`/reports/lecturer/${encodeURIComponent(email)}`);
export const getReportById = (id) => apiFetch(`/reports/${id}`);
export const createReport = (data) => apiFetch('/reports', { method: 'POST', body: JSON.stringify(data) });
export const addFeedback = (id, feedback) => apiFetch(`/reports/${id}/feedback`, { method: 'PATCH', body: JSON.stringify({ feedback }) });
export const deleteReport = (id) => apiFetch(`/reports/${id}`, { method: 'DELETE' });

// ATTENDANCE
export const getAllSessions = () => apiFetch('/attendance/sessions');
export const getOpenSessions = () => apiFetch('/attendance/sessions/open');
export const getSessionsByLecturer = (email) => apiFetch(`/attendance/sessions/lecturer/${encodeURIComponent(email)}`);
export const getSessionCheckIns = (sessionId) => apiFetch(`/attendance/session/${sessionId}/checkins`);
export const getStudentAttendance = (studentId) => apiFetch(`/attendance/student/${studentId}`);
export const openSession = (data) => apiFetch('/attendance/sessions', { method: 'POST', body: JSON.stringify(data) });
export const closeSession = (id, data) => apiFetch(`/attendance/sessions/${id}/close`, { method: 'PATCH', body: JSON.stringify(data) });
export const studentCheckIn = (data) => apiFetch('/attendance/checkin', { method: 'POST', body: JSON.stringify(data) });

// RATINGS
export const getAllRatings = () => apiFetch('/ratings');
export const getRatingsSummary = () => apiFetch('/ratings/summary');
export const getRatingsByLecturer = (email) => apiFetch(`/ratings/lecturer/${encodeURIComponent(email)}`);
export const submitRating = (data) => apiFetch('/ratings', { method: 'POST', body: JSON.stringify(data) });

// COURSES
export const getAllCourses = () => apiFetch('/courses');
export const getCourses = () => publicFetch('/courses'); // ✅ public — safe during registration
export const addCourse = (data) => apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) });
export const deleteCourse = (id) => apiFetch(`/courses/${id}`, { method: 'DELETE' });

// ASSIGNMENTS
export const getAllAssignments = () => apiFetch('/courses/assignments');
export const getAssignmentsByLecturer = (email) => apiFetch(`/courses/assignments/lecturer/${encodeURIComponent(email)}`);
export const assignLecturer = (data) => apiFetch('/courses/assignments', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id) => apiFetch(`/courses/assignments/${id}`, { method: 'DELETE' });