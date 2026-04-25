import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator
} from 'react-native';
import { firestore } from '../../services/FirebaseConfig'; 

export default function Monitoring() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('reports')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReports(data);
          setLoading(false);
        },
        err => {
          console.error('Firestore error:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    return unsubscribe;
  }, []);

  const totalClasses = reports.length;
  const avgAttendance = totalClasses > 0
    ? Math.round(
        reports.reduce((sum, r) => {
          const pct = r.totalStudents > 0
            ? (Number(r.actualStudents) / Number(r.totalStudents)) * 100 : 0;
          return sum + pct;
        }, 0) / totalClasses
      )
    : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', textAlign: 'center', padding: 20 }}>
          Error loading data:{'\n'}{error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Monitoring</Text>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: '#1a56db' }]}>
          <Text style={styles.cardNum}>{totalClasses}</Text>
          <Text style={styles.cardLabel}>Classes Held</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#059669' }]}>
          <Text style={styles.cardNum}>{avgAttendance}%</Text>
          <Text style={styles.cardLabel}>Avg Attendance</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Class Reports</Text>
      {reports.length === 0 ? (
        <Text style={styles.empty}>No reports available yet.</Text>
      ) : (
        reports.slice(0, 10).map(r => {
          const actual = Number(r.actualStudents) || 0;
          const total = Number(r.totalStudents) || 0;
          const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

          return (
            <View key={r.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.courseName}>{r.courseName || 'N/A'}</Text>
                <Text style={styles.courseCode}>{r.courseCode || ''}</Text>
              </View>
              <Text style={styles.detail}>📅 {r.date || 'No date'}</Text>
              <Text style={styles.detail}>👨‍🏫 {r.lecturerName || 'N/A'}</Text>
              <Text style={styles.detail}>📍 {r.venue || 'N/A'}</Text>
              <Text style={styles.detail}>🕐 {r.scheduledTime || 'N/A'}</Text>
              <Text style={styles.detail}>📖 Topic: {r.topic || 'N/A'}</Text>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceText}>
                  👥 {actual} / {total} students present
                </Text>
                {total > 0 && (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          flex: pct,
                          backgroundColor: pct >= 75 ? '#059669' : '#f59e0b',
                        },
                      ]}
                    />
                    <View style={{ flex: 100 - pct }} />
                  </View>
                )}
              </View>
              {r.learningOutcomes ? (
                <Text style={styles.outcomes}>🎯 {r.learningOutcomes}</Text>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  cardNum: { fontSize: 28, fontWeight: '900', color: '#fff' },
  cardLabel: { fontSize: 12, color: '#e5e7eb', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  reportCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 4, elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  courseName: { fontSize: 15, fontWeight: '700', color: '#1a56db', flex: 1 },
  courseCode: { fontSize: 12, color: '#6b7280', backgroundColor: '#f3f4f6', padding: 4, borderRadius: 6 },
  detail: { fontSize: 13, color: '#374151', marginBottom: 3 },
  attendanceRow: { marginTop: 8 },
  attendanceText: { fontSize: 13, color: '#374151', marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
  progressFill: { height: '100%', borderRadius: 3 },
  outcomes: { fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
});