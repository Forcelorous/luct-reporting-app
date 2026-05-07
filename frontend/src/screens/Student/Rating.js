import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../services/FirebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

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
    const q = query(collection(db, 'assignments'), orderBy('assignedAt', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!studentEmail) return;
    const q = query(collection(db, 'ratings'), where('studentEmail', '==', studentEmail));
    const unsubscribe = onSnapshot(q, snapshot => {
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

  const handleSubmit = async () => {
    if (starRating === 0) {
      Alert.alert('Error', 'Please select a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'ratings'), {
        lecturerEmail: selected.lecturerEmail,
        lecturerName: selected.lecturerName || selected.lecturerEmail,
        courseCode: selected.courseCode,
        rating: starRating,
        comment: comment.trim(),
        studentEmail,
        createdAt: new Date(),
      });
      setModalVisible(false);
      setStarRating(0);
      setComment('');
      Alert.alert('Success', 'Rating submitted!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value, onPress) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onPress(n)}>
          <Ionicons
            name={value >= n ? 'star' : 'star-outline'}
            size={28}
            color="#fbbf24"
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assignments to Rate</Text>
      <FlatList
        data={assignments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const key = `${item.lecturerEmail}_${item.courseCode}`;
          const alreadySubmitted = submittedKeys.has(key);
          return (
            <View style={styles.card}>
              <Text style={styles.course}>{item.courseCode} - {item.courseName}</Text>
              <Text style={styles.lecturer}>Lecturer: {item.lecturerName || item.lecturerEmail}</Text>
              <TouchableOpacity
                style={[styles.rateBtn, alreadySubmitted && styles.rateBtnDisabled]}
                disabled={alreadySubmitted}
                onPress={() => {
                  setSelected(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.rateBtnText}>
                  {alreadySubmitted ? 'Already Rated' : 'Rate Lecturer'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No assignments found.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Rate {selected?.lecturerName || selected?.lecturerEmail}</Text>
              {renderStars(starRating, setStarRating)}
              <TextInput
                style={styles.input}
                placeholder="Leave a comment (optional)"
                value={comment}
                onChangeText={setComment}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#271111', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  course: { fontSize: 15, fontWeight: '600', color: '#fb1414' },
  lecturer: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  rateBtn: {
    marginTop: 10, backgroundColor: '#1a1a1c',
    paddingVertical: 8, borderRadius: 6, alignItems: 'center',
  },
  rateBtnDisabled: { backgroundColor: '#9ca3af' },
  rateBtnText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    padding: 10, minHeight: 60, textAlignVertical: 'top', marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#6b7280' },
  submitBtn: { backgroundColor: '#3a3c40', padding: 10, borderRadius: 8 },
  submitText: { color: '#fff', fontWeight: '700' },
});
