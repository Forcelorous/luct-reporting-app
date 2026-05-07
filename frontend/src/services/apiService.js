// src/services/apiService.js
// ✅ All frontend API calls go through this file — no direct Firebase calls

import { getAuth } from 'firebase/auth';

const API_URL = "https://headfirst-reply-slightly.ngrok-free.dev";

// ✅ Get auth token from current user
const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
};

// ✅ Generic request helper
const request = async (method, endpoint, body = null) => {
  const token = await getToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ─── COURSES ─────────────────────────────────────────────
export const apiGetAllCourses = () => request('GET', '/courses');
export const apiAddCourse = (courseData) => request('POST', '/courses', courseData);
export const apiDeleteCourse = (id) => request('DELETE', `/courses/${id}`);
export const apiGetAllAssignments = () => request('GET', '/courses/assignments');
export const apiGetAssignmentsByLecturer = (email) => request('GET', `/courses/assignments/lecturer/${encodeURIComponent(email)}`);
export const apiAssignLecturer = (data) => request('POST', '/courses/assignments', data);
export const apiDeleteAssignment = (id) => request('DELETE', `/courses/assignments/${id}`);

// ─── REPORTS ─────────────────────────────────────────────
export const apiGetAllReports = () => request('GET', '/reports');
export const apiGetReportsByLecturer = (email) => request('GET', `/reports/lecturer/${encodeURIComponent(email)}`);
export const apiGetReportById = (id) => request('GET', `/reports/${id}`);
export const apiCreateReport = (reportData) => request('POST', '/reports', reportData);
export const apiAddFeedback = (id, feedback) => request('PATCH', `/reports/${id}/feedback`, { feedback });
export const apiDeleteReport = (id) => request('DELETE', `/reports/${id}`);

// ─── RATINGS ─────────────────────────────────────────────
export const apiGetAllRatings = () => request('GET', '/ratings');
export const apiGetRatingsByLecturer = (email) => request('GET', `/ratings/lecturer/${encodeURIComponent(email)}`);
export const apiGetRatingsSummary = () => request('GET', '/ratings/summary');
export const apiSubmitRating = (ratingData) => request('POST', '/ratings', ratingData);

// ─── USERS ───────────────────────────────────────────────
export const apiGetAllUsers = () => request('GET', '/users');
export const apiGetLecturers = () => request('GET', '/users/lecturers');
export const apiGetStudents = () => request('GET', '/users/students');
export const apiGetUserById = (id) => request('GET', `/users/${id}`);

// ─── ATTENDANCE ──────────────────────────────────────────
export const apiGetAllSessions = () => request('GET', '/attendance/sessions');
export const apiGetOpenSessions = () => request('GET', '/attendance/sessions/open');
export const apiGetSessionsByLecturer = (email) => request('GET', `/attendance/sessions/lecturer/${encodeURIComponent(email)}`);
export const apiGetSessionCheckIns = (sessionId) => request('GET', `/attendance/session/${sessionId}/checkins`);
export const apiGetStudentAttendance = (studentId) => request('GET', `/attendance/student/${studentId}`);
export const apiOpenSession = (data) => request('POST', '/attendance/sessions', data);
export const apiCloseSession = (id, data) => request('PATCH', `/attendance/sessions/${id}/close`, data);
export const apiStudentCheckIn = (data) => request('POST', '/attendance/checkin', data);