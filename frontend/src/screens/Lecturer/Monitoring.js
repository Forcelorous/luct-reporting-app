import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getReportsByLecturer } from '../../services/api';

export default function LecturerMonitoring() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const data = await getReportsByLecturer(user.email);
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [fetchReports]);

  const totalClasses = reports.length;
  const avgAttendance = totalClasses > 0
    ? Math.round(reports.reduce((sum, r) => {
        const t = Number(r.totalRegisteredStudents) || Number(r.totalStudents) || 0;
        const a = Number(r.actualStudentsPresent) || Number(r.actualStudents) || 0;
        return sum + (t > 0 ? (a / t) * 100 : 0);
      }, 0) / totalClasses)
    : 0;
  const totalStudentsSeen = reports.reduce((sum, r) =>
    sum + (Number(r.actualStudentsPresent) || Number(r.actualStudents) || 0), 0);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1aff00" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1aff00']} />}
    >
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
          const actual = Number(r.actualStudentsPresent) || Number(r.actualStudents) || 0;
          const total = Number(r.totalRegisteredStudents) || Number(r.totalStudents) || 0;
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
              <Text style={styles.detail}>📖 {r.topicTaught || r.topic || 'N/A'}</Text>
              {r.feedback && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackLabel}>💬 PRL Feedback:</Text>
                  <Text style={styles.feedbackText}>{r.feedback}</Text>
                </View>
              )}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  flex: pct,
                  backgroundColor: pct >= 75 ? '#059669' : '#f59e0b',
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
  reportCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  courseName: { fontSize: 15, fontWeight: '700', color: '#5900ff', flex: 1 },
  pctText: { fontSize: 15, fontWeight: '800', color: '#000000' },
  detail: { fontSize: 13, color: '#374151', marginBottom: 3 },
  feedbackBox: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 4 },
  feedbackLabel: { fontSize: 11, fontWeight: 'bold', color: '#2e7d32', marginBottom: 2 },
  feedbackText: { fontSize: 13, color: '#333' },
  progressBar: { height: 6, backgroundColor: '#ff0404', borderRadius: 3, overflow: 'hidden', flexDirection: 'row', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
});