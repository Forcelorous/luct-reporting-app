import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function PLRating() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore.collection('ratings')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRatings(data);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
    : '—';

  if (loading) return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.avgValue}>{avgRating}</Text>
        <Text style={styles.avgLabel}>Average Rating</Text>
        <Text style={styles.avgSub}>from {ratings.length} submission{ratings.length !== 1 ? 's' : ''}</Text>
      </View>

      <Text style={styles.sectionTitle}>All Ratings</Text>
      <FlatList
        data={ratings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.stars}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>
              <Text style={styles.ratingNum}>{item.rating}/5</Text>
            </View>
            <Text style={styles.meta}>Course: {item.courseCode || '—'}</Text>
            <Text style={styles.meta}>Lecturer: {item.lecturerName || '—'}</Text>
            {item.comment ? <Text style={styles.comment}>"{item.comment}"</Text> : null}
            <Text style={styles.date}>{item.createdAt?.toDate().toDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No ratings submitted yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  summaryCard: {
    backgroundColor: '#1a56db', borderRadius: 12,
    padding: 20, alignItems: 'center', marginBottom: 16,
  },
  avgValue: { fontSize: 48, fontWeight: '900', color: '#fff' },
  avgLabel: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  avgSub: { fontSize: 12, color: '#93c5fd', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stars: { fontSize: 16, color: '#f59e0b' },
  ratingNum: { fontSize: 13, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  comment: { fontSize: 13, color: '#374151', fontStyle: 'italic', marginTop: 6 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});