import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../../services/FirebaseConfig';

export default function Attendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [activeSession, setActiveSession] = useState(null); 
  const [checkIns, setCheckIns] = useState([]); 
  const [allStudents, setAllStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [tab, setTab] = useState('session'); 

  const user = auth.currentUser;

  useEffect(() => {
    // Load courses assigned to this lecturer
    const unsubCourses = firestore.collection('assignments')
      .where('lecturerEmail', '==', user.email)
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCourses(data);
          setLoading(false);
        },
        err => { console.error(err); setLoading(false); }
      );

    // Load all students
    const unsubStudents = firestore.collection('users')
      .where('role', '==', 'Student')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllStudents(data);
        },
        err => console.error(err)
      );

    // Check if this lecturer has an open session
    const unsubSession = firestore.collection('attendanceSessions')
      .where('lecturerEmail', '==', user.email)
      .where('isOpen', '==', true)
      .onSnapshot(
        snapshot => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setActiveSession({ id: doc.id, ...doc.data() });
          } else {
            setActiveSession(null);
          }
        },
        err => console.error(err)
      );

    // Load attendance history
    const unsubRecords = firestore.collection('attendanceSessions')
      .where('lecturerEmail', '==', user.email)
      .where('isOpen', '==', false)
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const aT = a.createdAt?.toDate?.() || new Date(0);
              const bT = b.createdAt?.toDate?.() || new Date(0);
              return bT - aT;
            });
          setRecords(data);
        },
        err => console.error(err)
      );

    return () => { unsubCourses(); unsubStudents(); unsubSession(); unsubRecords(); };
  }, []);

  // Live check-ins for active session
  useEffect(() => {
    if (!activeSession) { setCheckIns([]); return; }
    const unsubCheckIns = firestore.collection('studentAttendance')
      .where('sessionId', '==', activeSession.id)
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCheckIns(data);
        },
        err => console.error(err)
      );
    return unsubCheckIns;
  }, [activeSession?.id]);

  const handleOpenSession = async () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course.'); return;
    }
    if (!date.trim()) {
      Alert.alert('Error', 'Please enter the date.'); return;
    }
    setOpening(true);
    try {
      await firestore.collection('attendanceSessions').add({
        courseCode: selectedCourse.courseCode,
        lecturerEmail: user.email,
        lecturerName: user.displayName || user.email,
        date: date.trim(),
        venue: venue.trim(),
        isOpen: true,
        presentCount: 0,
        createdAt: new Date(),
      });
      setTab('session');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setOpening(false);
    }
  };

  const handleCloseSession = () => {
    Alert.alert(
      'Close Session',
      `Close attendance for ${activeSession.courseCode}? Students who haven't signed in will be marked absent.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Session', style: 'destructive',
          onPress: async () => {
            setClosing(true);
            try {
              const signedInIds = new Set(checkIns.map(c => c.studentId));
              const absentStudents = allStudents.filter(s => !signedInIds.has(s.id));

              const batch = firestore.batch();

              // Mark absent students
              absentStudents.forEach(student => {
                const ref = firestore.collection('studentAttendance').doc();
                batch.set(ref, {
                  sessionId: activeSession.id,
                  studentId: student.id,
                  studentEmail: student.email,
                  studentName: student.name || student.email,
                  courseCode: activeSession.courseCode,
                  lecturerEmail: user.email,
                  date: activeSession.date,
                  venue: activeSession.venue || '',
                  present: false,
                  createdAt: new Date(),
                });
              });

              // Close the session and save summary
              const sessionRef = firestore.collection('attendanceSessions').doc(activeSession.id);
              batch.update(sessionRef, {
                isOpen: false,
                presentCount: checkIns.length,
                absentCount: absentStudents.length,
                totalStudents: allStudents.length,
                closedAt: new Date(),
              });

              await batch.commit();
              Alert.alert('Session Closed', `${checkIns.length} present, ${absentStudents.length} absent.`);
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#00ff37" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'session' && styles.tabBtnActive]}
          onPress={() => setTab('session')}
        >
          <Text style={[styles.tabText, tab === 'session' && styles.tabTextActive]}>
            {activeSession ? '🟢 Live Session' : 'Open Session'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            History ({records.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'session' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {activeSession ? (
            <>
              <View style={styles.activeBanner}>
                <View style={styles.activeDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeBannerTitle}>
                    {activeSession.courseCode} — Live
                  </Text>
                  <Text style={styles.activeBannerSub}>
                    📅 {activeSession.date}
                    {activeSession.venue ? `  📍 ${activeSession.venue}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Students Signed In ({checkIns.length} / {allStudents.length})
                </Text>

                {checkIns.length > 0 && (
                  <>
                    <Text style={styles.subLabel}>✅ Present</Text>
                    {checkIns.map(c => (
                      <View key={c.id} style={styles.studentRowPresent}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {(c.studentName || c.studentEmail).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.studentName}>{c.studentName || c.studentEmail}</Text>
                          <Text style={styles.studentEmail}>{c.studentEmail}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={20} color="#059669" style={{ marginLeft: 'auto' }} />
                      </View>
                    ))}
                  </>
                )}

                {(() => {
                  const signedInIds = new Set(checkIns.map(c => c.studentId));
                  const notYet = allStudents.filter(s => !signedInIds.has(s.id));
                  if (notYet.length === 0) return null;
                  return (
                    <>
                      <Text style={[styles.subLabel, { marginTop: 12 }]}>⏳ Not Yet Signed In</Text>
                      {notYet.map(s => (
                        <View key={s.id} style={styles.studentRowAbsent}>
                          <View style={[styles.avatarCircle, { backgroundColor: '#e5e7eb' }]}>
                            <Text style={[styles.avatarText, { color: '#6b7280' }]}>
                              {(s.name || s.email).charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.studentName}>{s.name || s.email}</Text>
                            <Text style={styles.studentEmail}>{s.email}</Text>
                          </View>
                          <Ionicons name="time-outline" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                        </View>
                      ))}
                    </>
                  );
                })()}
              </View>

              <TouchableOpacity
                style={[styles.closeBtn, closing && styles.closeBtnDisabled]}
                onPress={handleCloseSession}
                disabled={closing}
              >
                {closing
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="stop-circle-outline" size={18} color="#fff" />
                      <Text style={styles.closeBtnText}>CLOSE SESSION</Text>
                    </>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Open Attendance Session</Text>
                <Text style={styles.hintText}>Select Course</Text>
                {courses.length === 0
                  ? <Text style={styles.empty}>No courses assigned to you yet.</Text>
                  : courses.map(course => (
                    <TouchableOpacity
                      key={course.id}
                      style={[
                        styles.courseChip,
                        selectedCourse?.id === course.id && styles.courseChipSelected,
                      ]}
                      onPress={() => setSelectedCourse(course)}
                    >
                      <Text style={[
                        styles.courseChipText,
                        selectedCourse?.id === course.id && styles.courseChipTextSelected,
                      ]}>
                        {course.courseCode}
                      </Text>
                    </TouchableOpacity>
                  ))
                }
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  placeholder="Date (e.g. 2026-04-21)"
                  value={date}
                  onChangeText={setDate}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Venue (optional)"
                  value={venue}
                  onChangeText={setVenue}
                />
                <TouchableOpacity
                  style={[styles.openBtn, opening && styles.openBtnDisabled]}
                  onPress={handleOpenSession}
                  disabled={opening}
                >
                  {opening
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Ionicons name="play-circle-outline" size={18} color="#fff" />
                        <Text style={styles.openBtnText}>OPEN SESSION</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.empty}>No attendance records yet.</Text>}
          renderItem={({ item }) => {
            const total = item.totalStudents || 0;
            const pct = total > 0
              ? Math.round((item.presentCount / total) * 100)
              : 0;
            return (
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyCode}>{item.courseCode}</Text>
                  <Text style={styles.historyPct}>{pct}%</Text>
                </View>
                <Text style={styles.historyMeta}>📅 {item.date}</Text>
                <Text style={styles.historyMeta}>📍 {item.venue || '—'}</Text>
                <Text style={styles.historyMeta}>
                  👥 {item.presentCount || 0} present · {item.absentCount || 0} absent
                </Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${pct}%`, backgroundColor: pct >= 75 ? '#059669' : '#f59e0b' }
                  ]} />
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 10, padding: 4, marginBottom: 14,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#ff0000' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },

  activeBanner: {
    backgroundColor: '#ecfdf5', borderRadius: 12,
    padding: 14, marginBottom: 12, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1, borderColor: '#6ee7b7',
  },
  activeDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#00ff37', marginRight: 12,
  },
  activeBannerTitle: { fontSize: 15, fontWeight: '800', color: '#065f46' },
  activeBannerSub: { fontSize: 12, color: '#58ae96', marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 12, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  hintText: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  subLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 },

  studentRowPresent: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderRadius: 8, marginBottom: 6,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
  },
  studentRowAbsent: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderRadius: 8, marginBottom: 6,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#09ff00', justifyContent: 'center',
    alignItems: 'center', marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  studentName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  studentEmail: { fontSize: 11, color: '#9ca3af' },

  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    padding: 10, marginBottom: 8, fontSize: 14, backgroundColor: '#f9fafb',
  },
  courseChip: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    padding: 10, marginBottom: 6, backgroundColor: '#f9fafb',
  },
  courseChipSelected: { backgroundColor: '#eff6ff', borderColor: '#000000' },
  courseChipText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  courseChipTextSelected: { color: '#338633' },

  openBtn: {
    backgroundColor: '#00ff0d', borderRadius: 10,
    padding: 14, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8, marginTop: 4,
  },
  openBtnDisabled: { backgroundColor: '#93c5fd' },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  closeBtn: {
    backgroundColor: '#ef4444', borderRadius: 10,
    padding: 14, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8, marginBottom: 20,
  },
  closeBtnDisabled: { backgroundColor: '#fca5a5' },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  historyCard: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8, elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  historyCode: { fontSize: 15, fontWeight: '700', color: '#070d18' },
  historyPct: { fontSize: 15, fontWeight: '800', color: '#111827' },
  historyMeta: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  progressBar: {
    height: 6, backgroundColor: '#e5e7eb',
    borderRadius: 3, marginTop: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 20, fontSize: 14 },
});