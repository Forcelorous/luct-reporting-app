import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { db } from '../../services/FirebaseConfig';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function Feedback() {
  const [reports, setReports] = useState([]);
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'reports'),
      snap => {
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { console.error(err); setLoading(false); }
    );
    return unsubscribe;
  }, []);

  const submitFeedback = async (reportId) => {
    const text = feedbackInputs[reportId]?.trim();
    if (!text) return Alert.alert('Error', 'Please enter feedback before submitting.');
    setSubmitting(reportId);
    try {
      await updateDoc(doc(db, 'reports', reportId), {
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
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1a56db" />
    </View>
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
              <Text style={styles.reportTitle}>{item.title || 'Untitled Report'}</Text>
              <Text style={styles.reportMeta}>
                By: {item.lecturerName || item.lecturerEmail || '—'}
              </Text>
              {item.description ? (
                <Text style={styles.reportDesc}>{item.description}</Text>
              ) : null}
              {item.prlFeedback ? (
                <View style={styles.existingFeedback}>
                  <Text style={styles.existingFeedbackLabel}>Previous feedback:</Text>
                  <Text style={styles.existingFeedbackText}>{item.prlFeedback}</Text>
                </View>
              ) : null}
              <TextInput
                style={styles.input}
                placeholder="Add feedback for this report..."
                placeholderTextColor="#9ca3af"
                value={feedbackInputs[item.id] || ''}
                onChangeText={val =>
                  setFeedbackInputs(prev => ({ ...prev, [item.id]: val }))
                }
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  submitting === item.id && styles.buttonDisabled,
                ]}
                onPress={() => submitFeedback(item.id)}
                disabled={submitting === item.id}
              >
                <Text style={styles.buttonText}>
                  {submitting === item.id
                    ? 'Submitting...'
                    : item.prlFeedback
                    ? 'Update Feedback'
                    : 'Submit Feedback'}
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
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  reportDesc: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 10,
    lineHeight: 18,
  },
  existingFeedback: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#1a56db',
  },
  existingFeedbackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a56db',
    marginBottom: 4,
  },
  existingFeedbackText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2def37',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});