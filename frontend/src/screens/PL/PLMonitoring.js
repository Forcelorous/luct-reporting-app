import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { getAllReports, getAllCourses, getAllAssignments, getLecturers } from '../../services/api';

export default function PLMonitoring() {
  const [stats, setStats] = useState({ reports: 0, courses: 0, assignments: 0, lecturers: 0 });
  const [avgAttendance, setAvgAttendance] = useState(0);
  const [byCourse, setByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reports, courses, assignments, lecturers] = await Promise.all([
        getAllReports(), getAllCourses(), getAllAssignments(), getLecturers(),
      ]);

      setStats({
        reports: reports.length,
        courses: courses.length,
        assignments: assignments.length,
        lecturers: lecturers.length,
      });

      const avg = reports.length > 0
        ? Math.round(reports.reduce((sum, r) => {
            const t = Number(r.totalRegisteredStudents) || Number(r.totalStudents) || 0;
            const a = Number(r.actualStudentsPresent) || Number(r.actualStudents) || 0;
            return sum + (t > 0 ? (a / t) * 100 : 0);
          }, 0) / reports.length)
        : 0;
      setAvgAttendance(avg);

      const grouped = reports.reduce((acc, r) => {
        const key = r.courseCode || 'Unknown';
        if (!acc[key]) acc[key] = { name: r.courseName || key, reports: [] };
        acc[key].reports.push(r);
        return acc;
      }, {});
      setByCourse(grouped);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  if (loading) return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Program Monitoring</Text>

      <View style={styles.grid}>
        <StatCard label="Total Reports" value={stats.reports} color="#2deb14" />
        <StatCard label="Courses" value={stats.courses} color="#059669" />
        <StatCard label="Assignments" value={stats.assignments} color="#d90606" />
        <StatCard label="Lecturers" value={stats.lecturers} color="#2d29f0" />
      </View>

      <View style={styles.avgCard}>
        <Text style={styles.avgLabel}>Overall Avg Attendance</Text>
        <Text style={[styles.avgValue, { color: avgAttendance >= 75 ? '#059669' : '#ef4444' }]}>
          {avgAttendance}%
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${avgAttendance}%`,
            backgroundColor: avgAttendance >= 75 ? '#059669' : '#ef4444',
          }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Course Breakdown</Text>
      {Object.keys(byCourse).length === 0 ? (
        <Text style={styles.empty}>No reports yet.</Text>
      ) : (
        Object.entries(byCourse).map(([code, info]) => {
          const courseAvg = Math.round(
            info.reports.reduce((sum, r) => {
              const t = Number(r.totalRegisteredStudents) || Number(r.totalStudents) || 0;
              const a = Number(r.actualStudentsPresent) || Number(r.actualStudents) || 0;
              return sum + (t > 0 ? (a / t) * 100 : 0);
            }, 0) / info.reports.length
          );
          return (
            <View key={code} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View>
                  <Text style={styles.courseName}>{info.name}</Text>
                  <Text style={styles.courseCode}>{code}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: courseAvg >= 75 ? '#dcfce7' : '#fef2f2' }]}>
                  <Text style={[styles.badgeText, { color: courseAvg >= 75 ? '#059669' : '#ef4444' }]}>
                    {courseAvg}%
                  </Text>
                </View>
              </View>
              <Text style={styles.courseStats}>
                📋 {info.reports.length} report{info.reports.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${courseAvg}%`,
                  backgroundColor: courseAvg >= 75 ? '#059669' : '#f59e0b',
                }]} />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const StatCard = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, width: '47%', borderLeftWidth: 4, elevation: 1 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  avgCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  avgLabel: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  avgValue: { fontSize: 36, fontWeight: '900', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  courseCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  courseName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  courseCode: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 14, fontWeight: '800' },
  courseStats: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});