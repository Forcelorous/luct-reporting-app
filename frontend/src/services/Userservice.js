import {
  apiGetAllUsers,
  apiGetLecturers,
  apiGetStudents,
  apiGetUserById,
  apiGetAllCourses,
} from './apiService';

export const getAllUsers = async () => {
  try {
    const users = await apiGetAllUsers();
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllLecturers = async () => {
  try {
    const lecturers = await apiGetLecturers();
    return { success: true, lecturers };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllStudents = async () => {
  try {
    const students = await apiGetStudents();
    return { success: true, students };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserById = async (id) => {
  try {
    const user = await apiGetUserById(id);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getLecturersByClass = async (className) => {
  try {
    const courses = await apiGetAllCourses();
    const lecturersMap = {};
    courses.forEach(course => {
      const stream = course.stream?.trim().toUpperCase();
      const cls = className?.trim().toUpperCase();
      if (stream === cls && course.assignedLecturer?.uid) {
        lecturersMap[course.assignedLecturer.uid] = {
          id: course.assignedLecturer.uid,
          uid: course.assignedLecturer.uid,
          name: course.assignedLecturer.name,
          email: course.assignedLecturer.email,
          faculty: course.assignedLecturer.faculty,
        };
      }
    });
    return { success: true, lecturers: Object.values(lecturersMap) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};