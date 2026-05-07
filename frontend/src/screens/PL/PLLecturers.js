import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getAllReports } from '../../services/api';

export default function PLLecturers() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchReports = async () => {
      try {
        const data = await getAllReports();
        if (mounted) setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchReports();
    return () => { mounted = false; };
  }, []);

  const lecturerMap = reports.reduce((acc, r) => {
    const key = r.lecturerEmail || r.lecturerName;
    if (!key) return acc;
    if (!acc[key]) acc[key] = { email: r.lecturerEmail || r.lecturerName, courses: new Set() };
    if (r.courseCode) acc[key].courses.add(r.courseCode);
    return acc;
  }, {});

  const lecturers = Object.values(lecturerMap).map(l => ({
    ...l,
    courses: [...l.courses],
  }));

  if (loading) return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Lecturers ({lecturers.length})</Text>
      <FlatList
        data={lecturers}
        keyExtractor={item => item.email}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.email}>{item.email}</Text>
            <View style={styles.chips}>
              {item.courses.length > 0
                ? item.courses.map(code => (
                    <View key={code} style={styles.chip}>
                      <Text style={styles.chipText}>{code}</Text>
                    </View>
                  ))
                : <Text style={styles.noAssign}>No courses assigned</Text>
              }
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No lecturers registered yet.</Text>}
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
  email: { fontSize: 14, fontWeight: '600', color: '#2f893a' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    backgroundColor: '#ffeffd', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipText: { fontSize: 11, color: '#ff0808', fontWeight: '700' },
  noAssign: { fontSize: 12, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});