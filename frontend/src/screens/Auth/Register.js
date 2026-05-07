import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  ActivityIndicator, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import Input from '../../components/Input';
import CustomButton from '../../components/CustomButtons';
import { auth, db } from '../../services/FirebaseConfig';
import { getCourses } from '../../services/api';

const ROLES = ['Student', 'Lecturer', 'PRL', 'PL'];

const ROLE_LABELS = {
  Student: { label: 'Student', icon: '🎓' },
  Lecturer: { label: 'Lecturer', icon: '👨‍🏫' },
  PRL: { label: 'Principal Lecturer', icon: '🧑‍💼' },
  PL: { label: 'Program Leader', icon: '👔' },
};

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    if (selectedRole === 'Student') {
      fetchCourses();
    } else {
      setCourses([]);
      setSelectedCourses([]);
      setCourseError('');
    }
  }, [selectedRole]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    setCourseError('');
    setCourses([]);

    try {
      const data = await getCourses();

      if (!Array.isArray(data)) {
        throw new Error('Unexpected response format from server.');
      }

      const withLecturer = data.filter(
        (c) => c.assignedLecturer && c.assignedLecturer.name
      );

      if (withLecturer.length === 0) {
        setCourseError('No courses are available yet. Please check back later or contact your Program Leader.');
      }

      setCourses(withLecturer);
    } catch (error) {
      console.error('Course fetch error:', error);
      setCourseError(error.message || 'Could not load courses. Make sure the backend is running.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const toggleCourse = (course) => {
    const isSelected = selectedCourses.find(c => c.id === course.id);
    
    if (isSelected) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
    } else if (selectedCourses.length < 6) {
      setSelectedCourses([...selectedCourses, course]);
    } else {
      Alert.alert('Limit Reached', 'You can select maximum 6 courses');
    }
  };

 const handleRegister = async () => {
  const trimmedEmail = email.trim();
  const trimmedName = name.trim();

  if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
    Alert.alert('Error', 'Please fill in all fields.');
    return;
  }
  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match.');
    return;
  }
  if (password.length < 6) {
    Alert.alert('Error', 'Password must be at least 6 characters.');
    return;
  }
  if (!selectedRole) {
    Alert.alert('Error', 'Please select your role.');
    return;
  }
  if (selectedRole === 'Student' && selectedCourses.length === 0) {
    Alert.alert('Error', 'Please select at least one course.');
    return;
  }

  setLoading(true);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, 'users', uid), {
      name: trimmedName,
      email: trimmedEmail,
      role: selectedRole,
      uid,
      createdAt: new Date().toISOString(),
      ...(selectedRole === 'Student' && {
        selectedCourses: selectedCourses.map(c => c.id),
        enrollmentComplete: true,
        enrolledAt: new Date().toISOString()
      })
    });

    // Create enrollment records for students
    if (selectedRole === 'Student' && selectedCourses.length > 0) {
      for (const course of selectedCourses) {
        await addDoc(collection(db, 'enrollments'), {
          studentUid: uid,
          studentName: trimmedName,
          studentEmail: trimmedEmail,
          courseId: course.id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          faculty: course.faculty || '',
          stream: course.stream || '',
          lecturerName: course.assignedLecturer?.name || '',
          lecturerUid: course.assignedLecturer?.uid || '',
          enrolledAt: new Date().toISOString(),
        });
      }
    }

    const courseList = selectedCourses.map(c => `• ${c.courseName}`).join('\n');
    Alert.alert(
      'Registration Successful!',
      selectedRole === 'Student'
        ? `Account created! Enrolled in ${selectedCourses.length} course(s):\n\n${courseList}`
        : `Account created as ${ROLE_LABELS[selectedRole].label}`,
      [{ text: 'OK' }]
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    Alert.alert('Registration Failed', error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your full names" />
        <Input
          label="Email" value={email} onChangeText={setEmail}
          placeholder="Enter your email address" keyboardType="email-address" autoCapitalize="none"
        />
        <Input
          label="Password" value={password} onChangeText={setPassword}
          placeholder="Enter your password" secureTextEntry
        />
        <Input
          label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword}
          placeholder="Repeat password" secureTextEntry
        />

        <Text style={styles.label}>Select Role:</Text>
        <View style={styles.roleContainer}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleButton, selectedRole === role && styles.selectedRoleButton]}
              onPress={() => setSelectedRole(role)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleIcon}>{ROLE_LABELS[role].icon}</Text>
              <Text style={[styles.roleText, selectedRole === role && styles.selectedRoleText]}>
                {ROLE_LABELS[role].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedRole === 'Student' && (
          <View style={styles.courseSection}>
            <View style={styles.courseHeader}>
              <Text style={styles.label}>Select Courses (Max 6):</Text>
              <View style={styles.headerButtons}>
                <Text style={styles.courseCount}>{selectedCourses.length}/6 selected</Text>
                {!loadingCourses && (
                  <TouchableOpacity onPress={fetchCourses} style={styles.refreshBtn}>
                    <Text style={styles.refreshText}>↻</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {selectedCourses.length > 0 && (
              <View style={styles.selectedContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedCourses.map(course => (
                    <View key={course.id} style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>{course.courseName}</Text>
                      <TouchableOpacity onPress={() => toggleCourse(course)}>
                        <Text style={styles.removeIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {loadingCourses && (
              <View style={styles.centeredRow}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.loadingText}>Loading available courses…</Text>
              </View>
            )}

            {!loadingCourses && courseError !== '' && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>{courseError}</Text>
              </View>
            )}

            {!loadingCourses && courses.map((course) => {
              const isSelected = selectedCourses.find(c => c.id === course.id);
              const isMaxReached = selectedCourses.length >= 6 && !isSelected;
              
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseItem, 
                    isSelected && styles.selectedCourseItem,
                    isMaxReached && styles.disabledCourse
                  ]}
                  onPress={() => toggleCourse(course)}
                  activeOpacity={0.8}
                  disabled={isMaxReached}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>

                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.courseName}</Text>
                    <Text style={styles.courseCode}>{course.courseCode}</Text>

                    <View style={styles.badgeRow}>
                      {course.faculty ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{course.faculty}</Text>
                        </View>
                      ) : null}
                      {course.stream ? (
                        <View style={[styles.badge, styles.badgeStream]}>
                          <Text style={styles.badgeText}>{course.stream}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.lecturerLine}>
                      👨‍🏫 {course.assignedLecturer.name}
                      {course.assignedLecturer.email ? ` · ${course.assignedLecturer.email}` : ''}
                    </Text>

                    {course.scheduledTime ? <Text style={styles.metaLine}>🕐 {course.scheduledTime}</Text> : null}
                    {course.venue ? <Text style={styles.metaLine}>📍 {course.venue}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.buttonContainer}>
          {loading
            ? <ActivityIndicator size="large" color="#000" />
            : <CustomButton 
                title={selectedRole === 'Student' ? `Register (${selectedCourses.length}/6 courses)` : "Register"} 
                onPress={handleRegister} 
              />
          }
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#000', textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },

  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { width: '48%', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', marginBottom: 10, backgroundColor: '#f9f9f9' },
  selectedRoleButton: { borderColor: '#fe2600', backgroundColor: '#e5e5e5' },
  roleIcon: { fontSize: 24, marginBottom: 5 },
  roleText: { fontSize: 14, color: '#292525' },
  selectedRoleText: { color: '#000', fontWeight: 'bold' },

  courseSection: { marginBottom: 20 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  courseCount: { fontSize: 13, color: '#666', fontWeight: '500' },
  refreshBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f0f0f0' },
  refreshText: { color: '#000', fontSize: 16, fontWeight: '600' },

  selectedContainer: { marginBottom: 12 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, gap: 8 },
  selectedText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  removeIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  centeredRow: { flexDirection: 'row', alignItems: 'center', padding: 12, justifyContent: 'center' },
  loadingText: { marginLeft: 8, color: '#666', fontSize: 14 },

  emptyBox: { alignItems: 'center', padding: 24, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa' },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  courseItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 10, backgroundColor: '#fff' },
  selectedCourseItem: { borderColor: '#000', backgroundColor: '#f5f5f5', borderWidth: 2 },
  disabledCourse: { opacity: 0.5 },

  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#999', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2, backgroundColor: '#fff' },
  checkboxSelected: { backgroundColor: '#000', borderColor: '#000' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  courseInfo: { flex: 1 },
  courseName: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 2 },
  courseCode: { fontSize: 13, color: '#555', marginBottom: 6 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6, gap: 6 },
  badge: { backgroundColor: '#e5e5e5', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeStream: { backgroundColor: '#d1d5db' },
  badgeText: { fontSize: 11, color: '#333', fontWeight: '600' },

  lecturerLine: { fontSize: 13, color: '#444', marginBottom: 2 },
  metaLine: { fontSize: 12, color: '#666', marginTop: 1 },

  buttonContainer: { marginTop: 10 },
  linkText: { marginTop: 20, textAlign: 'center', color: '#f00d0d', fontWeight: '600' },
});