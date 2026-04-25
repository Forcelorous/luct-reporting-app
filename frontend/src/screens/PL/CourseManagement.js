import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function CourseManagement() {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore.collection('courses')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(data);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  const handleAddCourse = async () => {
    if (!courseName.trim() || !courseCode.trim()) {
      Alert.alert('Error', 'Please enter both course name and code.');
      return;
    }
    setAdding(true);
    try {
      await firestore.collection('courses').add({
        courseName: courseName.trim(),
        courseCode: courseCode.trim(),
        createdAt: new Date(),
      });
      setCourseName('');
      setCourseCode('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Course', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await firestore.collection('courses').doc(id).delete();
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Add Course Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add New Course</Text>
        <TextInput
          style={styles.input}
          placeholder="Course Name"
          value={courseName}
          onChangeText={setCourseName}
        />
        <TextInput
          style={styles.input}
          placeholder="Course Code"
          value={courseCode}
          onChangeText={setCourseCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAddCourse}
          disabled={adding}
        >
          {adding
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.addBtnText}>+ ADD COURSE</Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        All Courses ({courses.length})
      </Text>

      {loading
        ? <ActivityIndicator size="large" color="#1a56db" style={{ marginTop: 20 }} />
        : <FlatList
            data={courses}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.courseCard}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{item.courseName}</Text>
                  <Text style={styles.courseCode}>{item.courseCode}</Text>
                  <Text style={styles.courseDate}>
                    Added: {item.createdAt?.toDate().toDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.courseName)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No courses added yet.</Text>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 8, padding: 10,
    marginBottom: 10, backgroundColor: '#f9fafb',
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#00ff40', borderRadius: 8,
    padding: 12, alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: '#93c5fd' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700',
    color: '#374151', marginBottom: 10,
  },
  courseCard: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1,
  },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 15, fontWeight: '700', color: '#0314ff' },
  courseCode: {
    fontSize: 12, fontWeight: '600',
    color: '#000000', marginTop: 2,
  },
  courseDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  deleteBtn: {
    backgroundColor: '#fee2e2', borderRadius: 8,
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});