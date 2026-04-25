import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function PRLClasses() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore.collection('reports').onSnapshot(
      snap => { setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err => { console.error(err); setLoading(false); }
    );
    return unsubscribe;
  }, []);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#1a56db" /></View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classes</Text>
      {reports.length === 0 ? (
        <Text style={styles.empty}>No classes recorded yet.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseName}>{item.courseName || 'N/A'}</Text>
                <Text style={styles.code}>{item.courseCode || ''}</Text>
              </View>
              <Text style={styles.detail}>📚 Class: {item.className || 'N/A'}</Text>
              <Text style={styles.detail}>👨‍🏫 {item.lecturerName || 'N/A'}</Text>
              <Text style={styles.detail}>📅 {item.dateOfLecture || 'N/A'} — Week {item.weekOfReporting || '?'}</Text>
              <Text style={styles.detail}>🕐 {item.scheduledTime || 'N/A'}</Text>
              <Text style={styles.detail}>📍 {item.venue || 'N/A'}</Text>
              <Text style={styles.detail}>👥 {item.actualStudents ?? '-'} / {item.totalStudents ?? '-'} present</Text>
              <Text style={styles.detail}>📖 {item.topic || 'N/A'}</Text>
              {item.prlFeedback && (
                <View style={styles.feedbackBadge}>
                  <Text style={styles.feedbackText}>✅ Feedback given</Text>
                </View>
              )}
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
  feedbackBadge: { backgroundColor: '#f0fdf4', borderRadius: 6, padding: 6, marginTop: 8 },
  feedbackText: { fontSize: 12, color: '#059669', fontWeight: '700' },
});