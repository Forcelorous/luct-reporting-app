import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function StreamOverview() {
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadedCourses = false, loadedReports = false;
    const check = () => { if (loadedCourses && loadedReports) setLoading(false); };

    const u1 = firestore.collection('courses').onSnapshot(snap => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loadedCourses = true; check();
    }, () => { loadedCourses = true; check(); });

    const u2 = firestore.collection('reports').onSnapshot(snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loadedReports = true; check();
    }, () => { loadedReports = true; check(); });

    return () => { u1(); u2(); };
  }, []);

  // Derive unique courses from reports if courses collection is empty
  const allCourses = courses.length > 0 ? courses : [
    ...new Map(reports.map(r => [r.courseCode, {
      id: r.courseCode, courseName: r.courseName,
      courseCode: r.courseCode, lecturer: r.lecturerName,
      faculty: r.facultyName,
    }])).values()
  ];

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#1a56db" /></View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Courses & Lectures</Text>
      {allCourses.length === 0 ? (
        <Text style={styles.empty}>No courses found. Reports will populate this automatically.</Text>
      ) : (
        <FlatList
          data={allCourses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const courseReports = reports.filter(r => r.courseCode === item.courseCode);
            const avgAtt = courseReports.length > 0
              ? Math.round(courseReports.reduce((sum, r) => {
                  const t = Number(r.totalStudents) || 0;
                  const a = Number(r.actualStudents) || 0;
                  return sum + (t > 0 ? (a / t) * 100 : 0);
                }, 0) / courseReports.length)
              : null;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.courseName}>{item.courseName || 'N/A'}</Text>
                  <Text style={styles.code}>{item.courseCode || ''}</Text>
                </View>
                <Text style={styles.detail}>👨‍🏫 Lecturer: {item.lecturer || 'N/A'}</Text>
                {item.faculty ? <Text style={styles.detail}>🏫 Faculty: {item.faculty}</Text> : null}
                <Text style={styles.detail}>📋 Reports: {courseReports.length}</Text>
                {avgAtt !== null && (
                  <Text style={styles.detail}>
                    📊 Avg Attendance: {avgAtt}%
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 15 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 60, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  courseName: { fontSize: 15, fontWeight: '700', color: '#1a56db', flex: 1 },
  code: { fontSize: 12, color: '#6b7280', backgroundColor: '#f3f4f6', padding: 4, borderRadius: 6 },
  detail: { fontSize: 13, color: '#374151', marginBottom: 2 },
});