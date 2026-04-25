import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../../services/FirebaseConfig';

export default function StudentRating() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [starRating, setStarRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedKeys, setSubmittedKeys] = useState(new Set());

  const studentEmail = auth.currentUser?.email;

  useEffect(() => {
    const unsubscribe = firestore
      .collection('assignments')
      .orderBy('assignedAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssignments(data);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!studentEmail) return;
    const unsubscribe = firestore
      .collection('ratings')
      .where('studentEmail', '==', studentEmail)
      .onSnapshot(snapshot => {
        const keys = new Set(
          snapshot.docs.map(doc => {
            const d = doc.data();
            return `${d.lecturerEmail}_${d.courseCode}`;
          })
        );
        setSubmittedKeys(keys);
      });
    return unsubscribe;
  }, [studentEmail]);

  const openModal = (item) => {
    setSelected(item);
    setStarRating(0);
    setComment('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (starRating === 0) {
      Alert.alert('Error', 'Please select a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      await firestore.collection('ratings').add({
        lecturerEmail: selected.lecturerEmail,
        lecturerName: selected.lecturerName || selected.lecturerEmail,
        courseCode: selected.courseCode,
        rating: starRating,
        comment: comment.trim(),
        studentEmail,
        createdAt: new Date(),
      });
      setModalVisible(false);
      Alert.alert('Success', 'Rating submitted!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#1a56db" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Rate Your Lecturers</Text>
      <Text style={styles.pageSub}>Tap a lecturer to submit your rating</Text>

      <FlatList
        data={assignments}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No lecturers assigned yet.</Text>
        }
        renderItem={({ item }) => {
          const alreadyRated = submittedKeys.has(
            `${item.lecturerEmail}_${item.courseCode}`
          );
          return (
            <TouchableOpacity
              style={[styles.card, alreadyRated && styles.cardRated]}
              onPress={() => !alreadyRated && openModal(item)}
              activeOpacity={alreadyRated ? 1 : 0.7}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(item.lecturerName || item.lecturerEmail).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.lecturerName}>
                  {item.lecturerName || item.lecturerEmail}
                </Text>
                <Text style={styles.lecturerEmail}>{item.lecturerEmail}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.courseCode}</Text>
                </View>
              </View>
              {alreadyRated ? (
                <View style={styles.ratedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.ratedText}>Rated</Text>
                </View>
              ) : (
                <Ionicons name="star-outline" size={22} color="#f59e0b" />
              )}
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate Lecturer</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {selected && (
                <>
                  <Text style={styles.modalLecturer}>
                    {selected.lecturerName || selected.lecturerEmail}
                  </Text>
                  <Text style={styles.modalEmail}>{selected.lecturerEmail}</Text>
                  <View style={styles.modalCourseBadge}>
                    <Text style={styles.modalCourseText}>{selected.courseCode}</Text>
                  </View>
                </>
              )}

              <Text style={styles.starLabel}>Your Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(val => (
                  <TouchableOpacity key={val} onPress={() => setStarRating(val)}>
                    <Ionicons
                      name={val <= starRating ? 'star' : 'star-outline'}
                      size={40}
                      color="#f59e0b"
                      style={styles.starIcon}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.starValue}>
                {starRating > 0 ? `${starRating} / 5` : 'Tap to rate'}
              </Text>

              <Text style={styles.commentLabel}>Comment (optional)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>SUBMIT RATING</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, marginTop: 40 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  pageSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 10, elevation: 1,
    flexDirection: 'row', alignItems: 'center',
  },
  cardRated: { opacity: 0.7 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1a56db', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  cardInfo: { flex: 1 },
  lecturerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  lecturerEmail: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 4 },
  badge: {
    backgroundColor: '#eff6ff', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, color: '#1a56db', fontWeight: '700' },
  ratedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratedText: { fontSize: 12, color: '#10b981', fontWeight: '600' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  modalLecturer: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  modalEmail: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  modalCourseBadge: {
    backgroundColor: '#eff6ff', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  modalCourseText: { fontSize: 13, color: '#1a56db', fontWeight: '700' },
  starLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starIcon: { marginHorizontal: 4 },
  starValue: { textAlign: 'center', fontSize: 13, color: '#6b7280', marginBottom: 20 },
  commentLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  commentInput: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: '#f9fafb',
    marginBottom: 20, minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#1a56db', borderRadius: 10,
    padding: 14, alignItems: 'center', marginBottom: 10,
  },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});