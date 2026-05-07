import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { getAllReports } from '../../services/api';

export default function PLReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

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

  if (loading) return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Reports ({reports.length})</Text>
      <FlatList
        data={reports}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setExpanded(expanded === item.id ? null : item.id)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseName}>{item.courseName} ({item.courseCode})</Text>
                <Text style={styles.meta}>{item.lecturerName} · {item.dateOfLecture}</Text>
              </View>
              <Text style={styles.chevron}>{expanded === item.id ? '▲' : '▼'}</Text>
            </View>
            {expanded === item.id && (
              <View style={styles.details}>
                <Row label="Faculty" value={item.facultyName} />
                <Row label="Class" value={item.className} />
                <Row label="Venue" value={item.venue} />
                <Row label="Time" value={item.lectureTime} />
                <Row label="Week" value={item.weekOfReporting} />
                <Row label="Students Present" value={`${item.actualStudents} / ${item.totalStudents}`} />
                <Row label="Topic" value={item.topic} />
                <Row label="Outcomes" value={item.outcomes} />
                <Row label="Recommendations" value={item.recommendations} />
                {item.prlFeedback && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>PRL Feedback:</Text>
                    <Text style={styles.feedbackText}>{item.prlFeedback}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reports submitted yet.</Text>}
      />
    </View>
  );
}

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}:</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  courseName: { fontSize: 14, fontWeight: '700', color: '#0c53eb' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  chevron: { color: '#9ca3af', fontSize: 12 },
  details: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  row: { flexDirection: 'row', marginBottom: 6 },
  rowLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', width: 130 },
  rowValue: { fontSize: 12, color: '#111827', flex: 1 },
  feedbackBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, marginTop: 8 },
  feedbackLabel: { fontSize: 12, fontWeight: '700', color: '#1a56db' },
  feedbackText: { fontSize: 12, color: '#1e40af', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});