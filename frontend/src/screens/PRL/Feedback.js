import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function Feedback() {
  const [reports, setReports] = useState([]);
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore.collection('reports').onSnapshot(
      snap => { setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err => { console.error(err); setLoading(false); }
    );
    return unsubscribe;
  }, []);

  const submitFeedback = async (reportId) => {
    const text = feedbackInputs[reportId]?.trim();
    if (!text) return Alert.alert('Error', 'Please enter feedback before submitting.');
    setSubmitting(reportId);
    try {
      await firestore.collection('reports').doc(reportId).update({
        prlFeedback: text,
        feedbackAt: new Date(),
      });
      setFeedbackInputs(prev => ({ ...prev, [reportId]: '' }));
      Alert.alert('Success', 'Feedback submitted!');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(null);
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#1a56db" /></View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports & Feedback</Text>
      {reports.length === 0 ? (
        <Text style={styles.empty}>No reports submitted yet.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseName}>{item.courseName || 'N/A'}</Text>
                <Text style={styles.code}>{item.courseCode || ''}</Text>
              </View>
              <Text style={styles.detail}>👨‍🏫 {item.lecturerName || 'N/A'}</Text>
              <Text style={styles.detail}>📅 {item.dateOfLecture || 'N/A'} — Week {item.weekOfReporting || '?'}</Text>
              <Text style={styles.detail}>📖 Topic: {item.topic || 'N/A'}</Text>
              <Text style={styles.detail}>👥 {item.actualStudents ?? '-'}/{item.totalStudents ?? '-'} present</Text>
              {item.learningOutcomes ? <Text style={styles.detail}>🎯 {item.learningOutcomes}</Text> : null}
              {item.recommendations ? <Text style={styles.detail}>💡 {item.recommendations}</Text> : null}

              {item.prlFeedback ? (
                <View style={styles.existingFeedback}>
                  <Text style={styles.feedbackLabel}>✅ Your Feedback:</Text>
                  <Text style={styles.feedbackText}>{item.prlFeedback}</Text>
                </View>
              ) : null}

              <TextInput
                style={styles.input}
                placeholder="Add feedback for this report..."
                placeholderTextColor="#9ca3af"
                value={feedbackInputs[item.id] || ''}
                onChangeText={val => setFeedbackInputs(prev => ({ ...prev, [item.id]: val }))}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.button, submitting === item.id && styles.buttonDisabled]}
                onPress={() => submitFeedback(item.id)}
                disabled={submitting === item.id}
              >
                <Text style={styles.buttonText}>
                  {submitting === item.id ? 'Submitting...' : item.prlFeedback ? 'Update Feedback' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 15 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 60 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  courseName: { fontSize: 15, fontWeight: '700', color: '#1a56db', flex: 1 },
  code: { fontSize: 12, color: '#6b7280', backgroundColor: '#f3f4f6', padding: 4, borderRadius: 6 },
  detail: { fontSize: 13, color: '#374151', marginBottom: 3 },
  existingFeedback: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginVertical: 8 },
  feedbackLabel: { fontSize: 12, fontWeight: '700', color: '#059669', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#374151' },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    padding: 10, backgroundColor: '#f9fafb', fontSize: 13,
    textAlignVertical: 'top', marginTop: 10, minHeight: 80,
  },
  button: { backgroundColor: '#1dff5d', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});