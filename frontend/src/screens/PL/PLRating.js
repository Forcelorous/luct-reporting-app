import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getAllRatings } from '../../services/api'; 

export default function PLRating() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRatings = useCallback(async () => {
    try {
      const data = await getAllRatings(); 
      setRatings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('PLRating error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchRatings(); }, [fetchRatings]);

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
    : '—';

  const byLecturer = ratings.reduce((acc, r) => {
    const key = r.lecturerName || r.lecturerEmail || 'Unknown';
    if (!acc[key]) acc[key] = { ratings: [], email: r.lecturerEmail };
    acc[key].ratings.push(r);
    return acc;
  }, {});

  if (loading) return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.avgValue}>{avgRating}</Text>
        <Text style={styles.avgStars}>
          {'★'.repeat(Math.round(Number(avgRating) || 0))}
          {'☆'.repeat(5 - Math.round(Number(avgRating) || 0))}
        </Text>
        <Text style={styles.avgLabel}>Program Average Rating</Text>
        <Text style={styles.avgSub}>
          from {ratings.length} submission{ratings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Ratings by Lecturer</Text>
      <FlatList
        data={Object.entries(byLecturer)}
        keyExtractor={([name]) => name}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No ratings submitted yet.</Text>}
        renderItem={({ item: [name, info] }) => {
          const lecAvg = (
            info.ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / info.ratings.length
          ).toFixed(1);
          return (
            <View style={styles.lecturerCard}>
              <View style={styles.lecturerHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lecturerName}>{name}</Text>
                  <Text style={styles.lecturerEmail}>{info.email || '—'}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeNum}>{lecAvg}</Text>
                  <Text style={styles.ratingBadgeStar}>★</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.statText}>
                  📝 {info.ratings.length} rating{info.ratings.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.statText}>
                  💬 {info.ratings.filter(r => r.comment).length} comments
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${(Number(lecAvg) / 5) * 100}%`,
                  backgroundColor: Number(lecAvg) >= 3.5 ? '#059669' : '#f59e0b',
                }]} />
              </View>

              {info.ratings.map((r, i) => (
                <View key={r.id || i} style={styles.ratingRow}>
                  <View style={styles.ratingRowTop}>
                    <Text style={styles.stars}>
                      {'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}
                    </Text>
                    <Text style={styles.ratingNum}>{r.rating}/5</Text>
                  </View>
                  {r.courseCode ? <Text style={styles.meta}>📚 {r.courseCode}</Text> : null}
                  {r.comment ? <Text style={styles.comment}>"{r.comment}"</Text> : null}
                  <Text style={styles.date}>
                    {r.createdAt ? new Date(r.createdAt).toDateString() : '—'}
                  </Text>
                </View>
              ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  summaryCard: { backgroundColor: '#db1a1a', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  avgValue: { fontSize: 52, fontWeight: '900', color: '#fff' },
  avgStars: { fontSize: 22, color: '#fbbf24', marginVertical: 4 },
  avgLabel: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  avgSub: { fontSize: 12, color: '#93c5fd', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  lecturerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  lecturerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1a56db', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  lecturerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  lecturerEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ratingBadgeNum: { fontSize: 18, fontWeight: '900', color: '#92400e' },
  ratingBadgeStar: { fontSize: 14, color: '#f59e0b', marginLeft: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  statText: { fontSize: 12, color: '#6b7280' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 3 },
  ratingRow: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8, marginTop: 8 },
  ratingRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stars: { fontSize: 14, color: '#f59e0b' },
  ratingNum: { fontSize: 13, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  comment: { fontSize: 13, color: '#374151', fontStyle: 'italic', marginTop: 2 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
});