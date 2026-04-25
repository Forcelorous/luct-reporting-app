import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function PLClasses() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore.collection('reports')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(data);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#15ff00" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Classes ({reports.length})</Text>
      <FlatList
        data={reports}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.courseName}>{item.courseName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.courseCode}</Text>
              </View>
            </View>
            <Text style={styles.meta}>👤 {item.lecturerName}</Text>
            <Text style={styles.meta}>📍 {item.venue} · 🕐 {item.lectureTime}</Text>
            <Text style={styles.meta}>📅 {item.dateOfLecture} · Week {item.weekOfReporting}</Text>
            <Text style={styles.meta}>
              👥 {item.actualStudents}/{item.totalStudents} students present
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No classes recorded yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8, elevation: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseName: { fontSize: 14, fontWeight: '700', color: '#5193a5', flex: 1 },
  badge: {
    backgroundColor: '#eff6ff', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: '#ff0303', fontWeight: '700' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});