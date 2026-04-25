import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../../services/FirebaseConfig';

export default function LecturerRatings() {
  const [grouped, setGrouped] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('ratings')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Group by lecturerEmail, display lecturerName
        const map = {};
        data.forEach(r => {
          const key = r.lecturerEmail || 'unknown';
          if (!map[key]) {
            map[key] = {
              email: r.lecturerEmail || '—',
              name: r.lecturerName || r.lecturerEmail || 'Unknown',
              items: [],
            };
          }
          map[key].items.push(r);
        });

        const result = Object.values(map).map(group => {
          const avg = (
            group.items.reduce((sum, r) => sum + (r.rating || 0), 0) / group.items.length
          ).toFixed(1);
          return { ...group, avg, count: group.items.length };
        });

        result.sort((a, b) => b.avg - a.avg);
        setGrouped(result);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  const toggleExpand = email => {
    setExpanded(prev => ({ ...prev, [email]: !prev[email] }));
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Lecturer Ratings</Text>

      <FlatList
        data={grouped}
        keyExtractor={item => item.email}
        ListEmptyComponent={
          <Text style={styles.empty}>No ratings submitted yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.lecturerCard}>
            <TouchableOpacity
              style={styles.lecturerHeader}
              onPress={() => toggleExpand(item.email)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.lecturerInfo}>
                <Text style={styles.lecturerName}>{item.name}</Text>
                <Text style={styles.lecturerEmail}>{item.email}</Text>
                <Text style={styles.lecturerSub}>
                  {item.count} rating{item.count !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>{item.avg}</Text>
                <Text style={styles.ratingBadgeStar}>★</Text>
              </View>

              <Ionicons
                name={expanded[item.email] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9ca3af"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>

            {expanded[item.email] && (
              <View style={styles.ratingsList}>
                {item.items.map(r => (
                  <View key={r.id} style={styles.ratingRow}>
                    <View style={styles.ratingRowTop}>
                      <Text style={styles.stars}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </Text>
                      <Text style={styles.ratingNum}>{r.rating}/5</Text>
                    </View>
                    {r.courseCode ? (
                      <Text style={styles.meta}>Course: {r.courseCode}</Text>
                    ) : null}
                    {r.studentEmail ? (
                      <Text style={styles.meta}>Student: {r.studentEmail}</Text>
                    ) : null}
                    {r.comment ? (
                      <Text style={styles.comment}>"{r.comment}"</Text>
                    ) : null}
                    <Text style={styles.date}>
                      {r.createdAt?.toDate().toDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 14 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },

  lecturerCard: {
    backgroundColor: '#fff', borderRadius: 12,
    marginBottom: 10, elevation: 1, overflow: 'hidden',
  },
  lecturerHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#db1a1a', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  lecturerInfo: { flex: 1 },
  lecturerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  lecturerEmail: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  lecturerSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#dfe7de', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  ratingBadgeText: { fontSize: 16, fontWeight: '800', color: '#92400e' },
  ratingBadgeStar: { fontSize: 14, color: '#f59e0b', marginLeft: 2 },

  ratingsList: {
    borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingHorizontal: 14,
  },
  ratingRow: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  ratingRowTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  stars: { fontSize: 15, color: '#f59e0b' },
  ratingNum: { fontSize: 13, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  comment: { fontSize: 13, color: '#374151', fontStyle: 'italic', marginTop: 4 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
});