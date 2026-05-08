import {
  apiGetAllRatings,
  apiGetRatingsByLecturer,
  apiGetRatingsSummary,
  apiSubmitRating,
} from './apiService';

const sortByDate = (arr) => arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const getAllRatings = async () => {
  try {
    const ratings = await apiGetAllRatings();
    return { success: true, ratings: sortByDate(ratings) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRatingsByLecturer = async (email) => {
  try {
    const data = await apiGetRatingsByLecturer(email);
    return {
      success: true,
      ratings: sortByDate(data.ratings || []),
      average: data.average || '0.0',
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRatingsSummary = async () => {
  try {
    const summary = await apiGetRatingsSummary();
    return { success: true, summary };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const submitRating = async (ratingData) => {
  try {
    const result = await apiSubmitRating(ratingData);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};