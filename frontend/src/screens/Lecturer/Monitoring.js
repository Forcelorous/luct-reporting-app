import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function LecturerMonitoring() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('reports')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReports(data);
          setLoading(false);
        },
        err => { console.error(err); setLoading(false); }
      );
    return unsubscribe;
  }, []);

  const totalClasses = reports.length;
  const avgAttendance = totalClasses > 0
    ? Math.round(reports.reduce((sum, r) => {
        const t = Number(r.totalStudents) || 0;
        const a = Number(r.actualStudents) || 0;
        return sum + (t > 0 ? (a / t) * 100 : 0);
      }, 0) / totalClasses)
    : 0;
  const totalStudentsSeen = reports.reduce((sum, r) => sum + (Number(r.actualStudents) || 0), 0);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1aff00" />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Monitoring Overview</Text>
      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: '#ff0000' }]}>
          <Text style={styles.cardNum}>{totalClasses}</Text>
          <Text style={styles.cardLabel}>Reports Submitted</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#2cc6dd' }]}>
          <Text style={styles.cardNum}>{avgAttendance}%</Text>
          <Text style={styles.cardLabel}>Avg Attendance</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#10d00c' }]}>
          <Text style={styles.cardNum}>{totalStudentsSeen}</Text>
          <Text style={styles.cardLabel}>Students Reached</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Classes Summary</Text>
      {reports.length === 0 ? (
        <Text style={styles.empty}>No reports yet. Submit your first report.</Text>
      ) : (
        reports.map(r => {
          const actual = Number(r.actualStudents) || 0;
          const total = Number(r.totalStudents) || 0;
          const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;
          return (
            <View key={r.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.courseName}>{r.courseName || 'N/A'}</Text>
                <Text style={styles.pctText}>{pct}%</Text>
              </View>
              <Text style={styles.detail}>📅 {r.dateOfLecture || 'N/A'} — Week {r.weekOfReporting || '?'}</Text>
              <Text style={styles.detail}>📍 {r.venue || 'N/A'} | 🕐 {r.scheduledTime || 'N/A'}</Text>
              <Text style={styles.detail}>👥 {actual} / {total} present</Text>
              <Text style={styles.detail}>📖 {r.topic || 'N/A'}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  flex: pct, backgroundColor: pct >= 75 ? '#059669' : '#f59e0b'
                }]} />
                <View style={{ flex: 100 - pct }} />
              </View>
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
  row: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  card: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  cardNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  cardLabel: { fontSize: 10, color: '#e5e7eb', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  reportCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, elevation: 2,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  courseName: { fontSize: 15, fontWeight: '700', color: '#5900ff', flex: 1 },
  pctText: { fontSize: 15, fontWeight: '800', color: '#000000' },
  detail: { fontSize: 13, color: '#374151', marginBottom: 3 },
  progressBar: {
    height: 6, backgroundColor: '#ff0404', borderRadius: 3,
    overflow: 'hidden', flexDirection: 'row', marginTop: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
});