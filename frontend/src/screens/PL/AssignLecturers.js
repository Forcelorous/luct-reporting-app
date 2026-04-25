import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../../services/FirebaseConfig';

export default function AssignLecturers() {
  const [courseCode, setCourseCode] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]); // from users collection
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubAssignments = firestore
      .collection('assignments')
      .orderBy('assignedAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssignments(data);
        setLoading(false);
      });

    const unsubCourses = firestore
      .collection('courses')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(data);
      });

    // Load all lecturers from users collection
    const unsubLecturers = firestore
      .collection('users')
      .where('role', '==', 'Lecturer')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLecturers(data);
      });

    return () => { unsubAssignments(); unsubCourses(); unsubLecturers(); };
  }, []);

  const handleAssign = async () => {
    if (!selectedLecturer) {
      Alert.alert('Error', 'Please select a lecturer.');
      return;
    }
    if (!courseCode.trim()) {
      Alert.alert('Error', 'Please select or enter a course code.');
      return;
    }

    // Check for duplicate
    const exists = assignments.some(
      a => a.lecturerEmail === selectedLecturer.email && a.courseCode === courseCode.trim()
    );
    if (exists) {
      Alert.alert('Error', `${selectedLecturer.name} is already assigned to ${courseCode.trim()}.`);
      return;
    }

    setAdding(true);
    try {
      await firestore.collection('assignments').add({
        lecturerEmail: selectedLecturer.email,
        lecturerName: selectedLecturer.name,
        courseCode: courseCode.trim(),
        assignedAt: new Date(),
      });
      setSelectedLecturer(null);
      setCourseCode('');
      setSearch('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id, name, code) => {
    Alert.alert('Remove Assignment', `Remove ${name} from ${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await firestore.collection('assignments').doc(id).delete();
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const filteredLecturers = lecturers.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Assign Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Assign Lecturer to Course</Text>

        {courses.length > 0 && (
          <View>
            <Text style={styles.hintText}>Select course:</Text>
            <View style={styles.chips}>
              {courses.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.chip,
                    courseCode === c.courseCode && styles.chipSelected,
                  ]}
                  onPress={() => setCourseCode(c.courseCode)}
                >
                  <Text style={[
                    styles.chipText,
                    courseCode === c.courseCode && styles.chipTextSelected,
                  ]}>
                    {c.courseCode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Course Code"
          value={courseCode}
          onChangeText={setCourseCode}
          autoCapitalize="characters"
        />

        <Text style={styles.hintText}>Select lecturer:</Text>
        <TextInput
          style={styles.input}
          placeholder="Search lecturer by name or email..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />

        {selectedLecturer && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{selectedLecturer.name}</Text>
              <Text style={styles.selectedEmail}>{selectedLecturer.email}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedLecturer(null)}>
              <Ionicons name="close-circle" size={22} color="#4eff02" />
            </TouchableOpacity>
          </View>
        )}

        {search.length > 0 && !selectedLecturer && (
          <View style={styles.dropdownList}>
            {filteredLecturers.length === 0 ? (
              <Text style={styles.noResults}>No lecturers found.</Text>
            ) : (
              filteredLecturers.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedLecturer(l);
                    setSearch('');
                  }}
                >
                  <View style={styles.dropdownAvatar}>
                    <Text style={styles.dropdownAvatarText}>
                      {l.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.dropdownName}>{l.name}</Text>
                    <Text style={styles.dropdownEmail}>{l.email}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAssign}
          disabled={adding}
        >
          {adding
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.addBtnText}>ASSIGN LECTURER</Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Assignments ({assignments.length})
      </Text>

      {loading
        ? <ActivityIndicator size="large" color="#1a56db" style={{ marginTop: 20 }} />
        : <FlatList
            data={assignments}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.assignCard}>
                <View style={styles.assignInfo}>
                  <Text style={styles.assignName}>
                    {item.lecturerName || item.lecturerEmail}
                  </Text>
                  <Text style={styles.assignEmail}>{item.lecturerEmail}</Text>
                  <View style={styles.assignMeta}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.courseCode}</Text>
                    </View>
                    <Text style={styles.assignDate}>
                      {item.assignedAt?.toDate().toDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.lecturerName || item.lecturerEmail, item.courseCode)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No assignments yet.</Text>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 16, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  hintText: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#f9fafb',
  },
  chipSelected: { backgroundColor: '#eff6ff', borderColor: '#1a56db' },
  chipText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  chipTextSelected: { color: '#1a56db' },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 8, padding: 10,
    marginBottom: 10, backgroundColor: '#f9fafb', fontSize: 14,
  },

  selectedCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', borderRadius: 8,
    padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#1a56db',
  },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 14, fontWeight: '700', color: '#1a56db' },
  selectedEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  dropdownList: {
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 8, backgroundColor: '#fff',
    marginBottom: 10, maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  dropdownAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#6487d1', justifyContent: 'center',
    alignItems: 'center', marginRight: 10,
  },
  dropdownAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  dropdownName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dropdownEmail: { fontSize: 12, color: '#6b7280' },
  noResults: { padding: 12, color: '#9ca3af', textAlign: 'center' },

  addBtn: {
    backgroundColor: '#00ff26', borderRadius: 8,
    padding: 12, alignItems: 'center', marginTop: 4,
  },
  addBtnDisabled: { backgroundColor: '#93c5fd' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },

  assignCard: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
  },
  assignInfo: { flex: 1 },
  assignName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  assignEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  assignMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  badge: {
    backgroundColor: '#eff6ff', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: '#ff0000', fontWeight: '700' },
  assignDate: { fontSize: 11, color: '#9ca3af' },
  deleteBtn: {
    backgroundColor: '#fee2e2', borderRadius: 8,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});