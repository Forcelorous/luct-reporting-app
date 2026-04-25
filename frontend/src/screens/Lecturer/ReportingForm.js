import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { auth, firestore } from '../../services/FirebaseConfig';
import { createReport, getAssignmentsByLecturer } from '../../services/api';

export default function ReportingForm() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const user = auth.currentUser;

  const [form, setForm] = useState({
    facultyName: 'Faculty of Information Communication Technology',
    className: '',
    weekOfReporting: '',
    dateOfLecture: '',
    courseName: '',
    courseCode: '',
    lecturerName: '',
    actualStudentsPresent: '',
    totalRegisteredStudents: '',
    venue: '',
    scheduledTime: '',
    topicTaught: '',
    learningOutcomes: '',
    recommendations: '',
  });

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get lecturer name from Firestore
        const userDoc = await firestore.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          set('lecturerName', userDoc.data().name || user.email);
        }
        // Load assigned courses from backend
        const data = await getAssignmentsByLecturer(user.email);
        setAssignments(data);
      } catch (error) {
        // Fallback to Firestore directly if backend fails
        try {
          const snapshot = await firestore.collection('assignments')
            .where('lecturerEmail', '==', user.email).get();
          setAssignments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (fbError) {
          console.error('Firestore fallback error:', fbError);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectCourse = (assignment) => {
    setSelectedAssignment(assignment);
    set('courseCode', assignment.courseCode);
    set('courseName', assignment.courseName || assignment.courseCode);
  };

  const handleSubmit = async () => {
    // Validate required fields
    const required = [
      { key: 'className', label: 'Class Name' },
      { key: 'weekOfReporting', label: 'Week of Reporting' },
      { key: 'dateOfLecture', label: 'Date of Lecture' },
      { key: 'courseCode', label: 'Course Code' },
      { key: 'lecturerName', label: "Lecturer's Name" },
      { key: 'actualStudentsPresent', label: 'Actual Students Present' },
      { key: 'totalRegisteredStudents', label: 'Total Registered Students' },
      { key: 'venue', label: 'Venue' },
      { key: 'scheduledTime', label: 'Scheduled Time' },
      { key: 'topicTaught', label: 'Topic Taught' },
      { key: 'learningOutcomes', label: 'Learning Outcomes' },
    ];

    for (const field of required) {
      if (!form[field.key]?.trim()) {
        Alert.alert('Error', `Please fill in: ${field.label}`);
        return;
      }
    }

    setSubmitting(true);
    const reportData = {
      ...form,
      lecturerEmail: user.email,
      actualStudentsPresent: parseInt(form.actualStudentsPresent) || 0,
      totalRegisteredStudents: parseInt(form.totalRegisteredStudents) || 0,
      createdAt: new Date(),
    };

    try {
      // Try backend first
      await createReport(reportData);
      Alert.alert('Success', 'Report submitted successfully!');
      resetForm();
    } catch (error) {
      // Fallback to Firestore directly
      try {
        await firestore.collection('reports').add(reportData);
        Alert.alert('Success', 'Report submitted!');
        resetForm();
      } catch (fbError) {
        Alert.alert('Error', fbError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedAssignment(null);
    setForm(prev => ({
      ...prev,
      className: '',
      weekOfReporting: '',
      dateOfLecture: '',
      courseName: '',
      courseCode: '',
      actualStudentsPresent: '',
      totalRegisteredStudents: '',
      venue: '',
      scheduledTime: '',
      topicTaught: '',
      learningOutcomes: '',
      recommendations: '',
    }));
  };

  if (loading) return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Lecturer Report</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Course</Text>
          {assignments.length === 0
            ? <Text style={styles.empty}>No courses assigned yet.</Text>
            : assignments.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[styles.chip, selectedAssignment?.id === a.id && styles.chipSelected]}
                onPress={() => selectCourse(a)}
              >
                <Text style={[styles.chipText, selectedAssignment?.id === a.id && styles.chipTextSelected]}>
                  {a.courseCode}
                </Text>
              </TouchableOpacity>
            ))
          }
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Information</Text>
          <Field label="Faculty Name" value={form.facultyName} onChangeText={v => set('facultyName', v)} />
          <Field label="Class Name" value={form.className} onChangeText={v => set('className', v)} />
          <Field label="Week of Reporting (e.g. Week 3)" value={form.weekOfReporting} onChangeText={v => set('weekOfReporting', v)} />
          <Field label="Date of Lecture" value={form.dateOfLecture} onChangeText={v => set('dateOfLecture', v)} placeholder="e.g. 2026-04-22" />
          <Field label="Course Name" value={form.courseName} onChangeText={v => set('courseName', v)} />
          <Field label="Course Code" value={form.courseCode} onChangeText={v => set('courseCode', v)} />
          <Field label="Lecturer's Name" value={form.lecturerName} onChangeText={v => set('lecturerName', v)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance</Text>
          <Field label="Actual Students Present" value={form.actualStudentsPresent} onChangeText={v => set('actualStudentsPresent', v)} keyboardType="numeric" />
          <Field label="Total Registered Students" value={form.totalRegisteredStudents} onChangeText={v => set('totalRegisteredStudents', v)} keyboardType="numeric" />
          <Field label="Venue" value={form.venue} onChangeText={v => set('venue', v)} />
          <Field label="Scheduled Lecture Time" value={form.scheduledTime} onChangeText={v => set('scheduledTime', v)} placeholder="e.g. 08:00 - 10:00" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic Content</Text>
          <Field label="Topic Taught" value={form.topicTaught} onChangeText={v => set('topicTaught', v)} multiline />
          <Field label="Learning Outcomes" value={form.learningOutcomes} onChangeText={v => set('learningOutcomes', v)} multiline />
          <Field label="Recommendations (optional)" value={form.recommendations} onChangeText={v => set('recommendations', v)} multiline />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>SUBMIT REPORT</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Field = ({ label, multiline, ...props }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    padding: 10, fontSize: 14, backgroundColor: '#f9fafb',
  },
  inputMultiline: { minHeight: 80 },
  chip: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    padding: 10, marginBottom: 6, backgroundColor: '#f9fafb',
  },
  chipSelected: { backgroundColor: '#eff6ff', borderColor: '#1a56db' },
  chipText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  chipTextSelected: { color: '#1a56db' },
  submitBtn: {
    backgroundColor: '#1a56db', borderRadius: 10,
    padding: 14, alignItems: 'center', marginBottom: 30,
  },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  empty: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8 },
});