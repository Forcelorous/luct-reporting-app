import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function PRLRating() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore.collection('ratings').onSnapshot(
      snap => { setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err => { console.error(err); setLoading(false); }
    );
    return unsubscribe;
  }, []);

  const avg = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / ratings.length).toFixed(1)
    : 'N/A';

  const stars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  // Group by course
  const byCourse = ratings.reduce((acc, r) => {
    const key = r.courseName || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#1a56db" /></View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stream Ratings</Text>
      <View style={styles.avgCard}>
        <Text style={styles.avgNum}>{avg}</Text>
        <Text style={styles.avgStars}>{avg !== 'N/A' ? stars(Number(avg)) : '☆☆☆☆☆'}</Text>
        <Text style={styles.avgLabel}>Overall Average ({ratings.length} ratings)</Text>
      </View>

      {Object.entries(byCourse).map(([course, rts]) => {
        const cAvg = (rts.reduce((s, r) => s + (Number(r.rating) || 0), 0) / rts.length).toFixed(1);
        return (
          <View key={course} style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseName}>{course}</Text>
              <Text style={styles.courseAvg}>{stars(Number(cAvg))} {cAvg}</Text>
            </View>
            <Text style={styles.detail}>{rts.length} rating{rts.length !== 1 ? 's' : ''}</Text>
          </View>
        );
      })}
      {ratings.length === 0 && <Text style={styles.empty}>No ratings yet.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  avgCard: { backgroundColor: '#1a56db', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  avgNum: { fontSize: 48, fontWeight: '900', color: '#fff' },
  avgStars: { fontSize: 24, color: '#fbbf24', marginVertical: 4 },
  avgLabel: { fontSize: 13, color: '#bfdbfe' },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  courseCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  courseName: { fontSize: 15, fontWeight: '700', color: '#1a56db', flex: 1 },
  courseAvg: { fontSize: 13, color: '#fbbf24' },
  detail: { fontSize: 13, color: '#6b7280' },
});