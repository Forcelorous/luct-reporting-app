import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function LecturerRating() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('ratings')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRatings(data);
          setLoading(false);
        },
        err => { console.error(err); setLoading(false); }
      );
    return unsubscribe;
  }, []);

  const avg = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / ratings.length).toFixed(1)
    : 'N/A';

  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#00ff33" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Ratings</Text>
      <View style={styles.avgCard}>
        <Text style={styles.avgNum}>{avg}</Text>
        <Text style={styles.avgStars}>{avg !== 'N/A' ? stars(Number(avg)) : '☆☆☆☆☆'}</Text>
        <Text style={styles.avgLabel}>Average Rating ({ratings.length} reviews)</Text>
      </View>
      {ratings.length === 0 ? (
        <Text style={styles.empty}>No ratings received yet.</Text>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.stars}>{stars(Number(item.rating) || 0)}</Text>
                <Text style={styles.ratingNum}>{item.rating}/5</Text>
              </View>
              {item.comment ? <Text style={styles.comment}>"{item.comment}"</Text> : null}
              <Text style={styles.course}>{item.courseName || 'General'}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  avgCard: {
    backgroundColor: '#ff0202', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 20,
  },
  avgNum: { fontSize: 48, fontWeight: '900', color: '#fff' },
  avgStars: { fontSize: 24, color: '#fbbf24', marginVertical: 4 },
  avgLabel: { fontSize: 13, color: '#bfdbfe' },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stars: { fontSize: 18, color: '#fbbf24' },
  ratingNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  comment: { fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 6 },
  course: { fontSize: 12, color: '#9ca3af' },
});