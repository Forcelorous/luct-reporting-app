// src/utils/ExcelExport.js
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCSV = (data) => {
  const headers = [
    'Course Code', 'Course Name', 'Faculty Name', 'Class Name',
    'Week of Reporting', 'Date of Lecture', 'Scheduled Time', 'Venue',
    'Lecturer Name', 'Lecturer Email', 'Students Present', 'Total Registered',
    'Attendance Rate', 'Topic Taught', 'Learning Outcomes',
    'Recommendations', 'PRL Feedback',
  ];

  const rows = data.map(item => {
    const present = item.actualStudentsPresent ?? item.actualStudents ?? 0;
    const total = item.totalRegisteredStudents ?? item.registeredStudents ?? 0;
    const rate = total > 0
      ? `${Math.round((Number(present) / Number(total)) * 100)}%`
      : '—';

    return [
      item.courseCode, item.courseName, item.facultyName, item.className,
      item.weekOfReporting, item.dateOfLecture, item.scheduledTime, item.venue,
      item.lecturerName, item.lecturerEmail, present, total, rate,
      item.topicTaught, item.learningOutcomes, item.recommendations, item.feedback,
    ].map(escapeCell);
  });

  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

export const exportToCSV = async (data, filename = 'reports.csv') => {
  try {
    const csv = buildCSV(data);

    // WEB
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    }

    // Android
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Reports CSV',
      });
      return { success: true };
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};