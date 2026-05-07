import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator
} from 'react-native';
import { db, auth } from '../../services/FirebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function StudentMonitoring() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentEmail = auth.currentUser?.email;

  useEffect(() => {
    if (!studentEmail) return;

    const q = query(
      collection(db, 'studentAttendance'),
      where('studentEmail', '==', studentEmail)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendance(data);
      setLoading(false);
    }, err => {
      console.error('StudentMonitoring error:', err.message);
      setLoading(false);
    });

    return unsubscribe;
  }, [studentEmail]);

  const byCourse = attendance.reduce((acc, r) => {
    const key = r.courseCode || 'Unknown';
    if (!acc[key]) acc[key] = { attended: 0, courseCode: key };
    acc[key].attended += 1;
    return acc;
  }, {});

  const totalAttended = attendance.length;
  const totalCourses = Object.keys(byCourse).length;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1a56db" />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>My Attendance</Text>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: '#1a56db' }]}>
          <Text style={styles.cardNum}>{totalAttended}</Text>
          <Text style={styles.cardLabel}>Classes Attended</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#059669' }]}>
          <Text style={styles.cardNum}>{totalCourses}</Text>
          <Text style={styles.cardLabel}>Courses</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Attendance by Course</Text>

      {Object.values(byCourse).length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.empty}>No attendance records yet.</Text>
          <Text style={styles.emptySub}>Your attendance will appear here once recorded.</Text>
        </View>
      ) : (
        Object.values(byCourse).map(course => {
          const maxSessions = Math.max(...Object.values(byCourse).map(c => c.attended), 1);
          const pct = Math.round((course.attended / maxSessions) * 100);
          const color = pct >= 75 ? '#059669' : pct >= 50 ? '#f59e0b' : '#ef4444';

          return (
            <View key={course.courseCode} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseCode}>{course.courseCode}</Text>
                <Text style={[styles.attendedCount, { color }]}>
                  {course.attended} session{course.attended !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.pctLabel, { color }]}>{pct}% relative attendance</Text>
            </View>
          );
        })
      )}

      {attendance.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {attendance.slice(0, 10).map(r => (
            <View key={r.id} style={styles.sessionCard}>
              <View style={styles.sessionLeft}>
                <View style={styles.presentDot} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionCourse}>{r.courseCode || 'Unknown Course'}</Text>
                <Text style={styles.sessionDate}>📅 {r.date || '—'}</Text>
                {r.venue ? <Text style={styles.sessionVenue}>📍 {r.venue}</Text> : null}
              </View>
              <Text style={styles.presentBadge}>✓ Present</Text>
            </View>
          ))}
        </>
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

  emptyBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { fontSize: 15, fontWeight: '700', color: '#9ca3af', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#d1d5db', textAlign: 'center' },

  courseCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  courseCode: { fontSize: 15, fontWeight: '700', color: '#1a56db' },
  attendedCount: { fontSize: 13, fontWeight: '600' },
  progressTrack: {
    height: 8, backgroundColor: '#e5e7eb', borderRadius: 4,
    overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  pctLabel: { fontSize: 11, fontWeight: '600' },

  sessionCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    marginBottom: 8, flexDirection: 'row', alignItems: 'center',
    elevation: 1,
  },
  sessionLeft: { marginRight: 12 },
  presentDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#059669',
  },
  sessionInfo: { flex: 1 },
  sessionCourse: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sessionDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  sessionVenue: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  presentBadge: {
    fontSize: 12, fontWeight: '700', color: '#059669',
    backgroundColor: '#d1fae5', paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 6,
  },
});