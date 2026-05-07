import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getAllReports } from '../../services/api';

export default function PRLMonitoring() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await getAllReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const totalReports = reports.length;
  const avgAtt = totalReports > 0
    ? Math.round(reports.reduce((sum, r) => {
        const t = Number(r.totalRegisteredStudents) || Number(r.totalStudents) || 0;
        const a = Number(r.actualStudentsPresent) || Number(r.actualStudents) || 0;
        return sum + (t > 0 ? (a / t) * 100 : 0);
      }, 0) / totalReports)
    : 0;
  const withFeedback = reports.filter(r => r.feedback || r.prlFeedback).length;
  const uniqueLecturers = [...new Set(reports.map(r => r.lecturerName).filter(Boolean))];
  const uniqueCourses = [...new Set(reports.map(r => r.courseCode).filter(Boolean))];

  const byLecturer = reports.reduce((acc, r) => {
    const key = r.lecturerName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#1a56db" /></View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Stream Monitoring</Text>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: '#1a56db' }]}>
          <Text style={styles.cardNum}>{totalReports}</Text>
          <Text style={styles.cardLabel}>Total Reports</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#059669' }]}>
          <Text style={styles.cardNum}>{avgAtt}%</Text>
          <Text style={styles.cardLabel}>Avg Attendance</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#7c3aed' }]}>
          <Text style={styles.cardNum}>{withFeedback}</Text>
          <Text style={styles.cardLabel}>With Feedback</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: '#d97706' }]}>
          <Text style={styles.cardNum}>{uniqueLecturers.length}</Text>
          <Text style={styles.cardLabel}>Lecturers</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#dc2626' }]}>
          <Text style={styles.cardNum}>{uniqueCourses.length}</Text>
          <Text style={styles.cardLabel}>Courses</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#0891b2' }]}>
          <Text style={styles.cardNum}>{totalReports - withFeedback}</Text>
          <Text style={styles.cardLabel}>Pending Review</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Lecturer Performance</Text>
      {Object.keys(byLecturer).length === 0 ? (
        <Text style={styles.empty}>No reports available yet.</Text>
      ) : (
        Object.entries(byLecturer).map(([lecturer, lecReports]) => {
          const lecAvg = Math.round(
            lecReports.reduce((sum, r) => {
              const t = Number(r.totalRegisteredStudents) || Number(r.totalStudents) || 0;
              const a = Number(r.actualStudentsPresent) || Number(r.actualStudents) || 0;
              return sum + (t > 0 ? (a / t) * 100 : 0);
            }, 0) / lecReports.length
          );
          const reviewed = lecReports.filter(r => r.feedback || r.prlFeedback).length;
          return (
            <View key={lecturer} style={styles.lecturerCard}>
              <View style={styles.lecturerHeader}>
                <Text style={styles.lecturerName}>{lecturer}</Text>
                <Text style={styles.lecturerBadge}>{lecReports.length} reports</Text>
              </View>
              <View style={styles.lecturerStats}>
                <Text style={styles.lecturerStat}>📊 Avg Attendance: {lecAvg}%</Text>
                <Text style={styles.lecturerStat}>✅ Reviewed: {reviewed}/{lecReports.length}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  flex: lecAvg,
                  backgroundColor: lecAvg >= 75 ? '#059669' : '#f59e0b',
                }]} />
                <View style={{ flex: Math.max(0, 100 - lecAvg) }} />
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
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  card: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  cardNum: { fontSize: 24, fontWeight: '900', color: '#fff' },
  cardLabel: { fontSize: 11, color: '#e5e7eb', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 8 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  lecturerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  lecturerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lecturerName: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  lecturerBadge: { fontSize: 11, color: '#1a56db', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  lecturerStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lecturerStat: { fontSize: 12, color: '#6b7280' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
  progressFill: { height: '100%', borderRadius: 3 },
});