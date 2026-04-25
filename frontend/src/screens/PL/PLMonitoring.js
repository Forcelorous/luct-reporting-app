import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function PLMonitoring() {
  const [stats, setStats] = useState({ reports: 0, courses: 0, assignments: 0, lecturers: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [];

    unsubs.push(firestore.collection('reports').onSnapshot(s => {
      setStats(prev => ({ ...prev, reports: s.size }));
      const recent = s.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
        .slice(0, 5);
      setRecentReports(recent);
      setLoading(false);
    }));

    unsubs.push(firestore.collection('courses').onSnapshot(s =>
      setStats(prev => ({ ...prev, courses: s.size }))));

    unsubs.push(firestore.collection('assignments').onSnapshot(s =>
      setStats(prev => ({ ...prev, assignments: s.size }))));

    unsubs.push(firestore.collection('users')
      .where('role', '==', 'Lecturer')
      .onSnapshot(s => setStats(prev => ({ ...prev, lecturers: s.size }))));

    return () => unsubs.forEach(u => u());
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;

  return (
    <View style={styles.container}>
      
      <View style={styles.grid}>
        <StatCard label="Total Reports" value={stats.reports} color="#2deb14" />
        <StatCard label="Courses" value={stats.courses} color="#059669" />
        <StatCard label="Assignments" value={stats.assignments} color="#d90606" />
        <StatCard label="Lecturers" value={stats.lecturers} color="#2d29f0" />
      </View>

      <Text style={styles.sectionTitle}>Recent Reports</Text>
      <FlatList
        data={recentReports}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.courseName} ({item.courseCode})</Text>
            <Text style={styles.cardMeta}>{item.lecturerName} · {item.dateOfLecture}</Text>
            <Text style={styles.cardTopic} numberOfLines={1}>Topic: {item.topic}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reports yet.</Text>}
      />
    </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    backgroundColor: '#82a1ad', borderRadius: 10,
    padding: 14, width: '47%',
    borderLeftWidth: 4, elevation: 1,
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#232529', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#2f5ec3' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardTopic: { fontSize: 12, color: '#374151', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});