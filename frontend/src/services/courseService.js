import {
  apiGetAllCourses,
  apiAddCourse,
  apiDeleteCourse,
  apiAssignLecturer,
  apiGetAssignmentsByLecturer,
} from './apiService';

const sortByDate = (arr) => arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const getAllCourses = async () => {
  try {
    const courses = await apiGetAllCourses();
    return { success: true, courses: sortByDate(courses) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addCourse = async (courseData) => {
  try {
    const course = await apiAddCourse(courseData);
    return { success: true, course };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCourse = async (id) => {
  try {
    await apiDeleteCourse(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const assignLecturerToCourse = async (courseId, lecturerData) => {
  try {
    const result = await apiAssignLecturer({
      courseId,
      lecturerEmail: lecturerData.email,
      lecturerName: lecturerData.name,
      courseCode: lecturerData.courseCode,
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCoursesByLecturer = async (email) => {
  try {
    const assignments = await apiGetAssignmentsByLecturer(email);
    return { success: true, courses: assignments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};