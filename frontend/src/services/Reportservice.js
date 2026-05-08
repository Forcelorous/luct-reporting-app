import {
  apiGetAllReports,
  apiGetReportsByLecturer,
  apiGetReportById,
  apiCreateReport,
  apiAddFeedback,
  apiDeleteReport,
} from './apiService';

const sortByDate = (arr) => arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const getAllReports = async () => {
  try {
    const reports = await apiGetAllReports();
    return { success: true, reports: sortByDate(reports) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getReportsByLecturer = async (email) => {
  try {
    const reports = await apiGetReportsByLecturer(email);
    return { success: true, reports: sortByDate(reports) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getReportById = async (id) => {
  try {
    const report = await apiGetReportById(id);
    return { success: true, report };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const submitReport = async (reportData) => {
  try {
    const report = await apiCreateReport(reportData);
    return { success: true, report };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addFeedbackToReport = async (id, feedback) => {
  try {
    await apiAddFeedback(id, feedback);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteReport = async (id) => {
  try {
    await apiDeleteReport(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};