import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../../services/FirebaseConfig';

export default function ViewAttendance() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(null); // session id being signed into
  const [tab, setTab] = useState('checkin'); // 'checkin' | 'history'
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });
  const [signedInSessions, setSignedInSessions] = useState(new Set());

  const user = auth.currentUser;

  useEffect(() => {
    // Load active sessions (open by lecturers)
    const unsubSessions = firestore.collection('attendanceSessions')
      .where('isOpen', '==', true)
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setActiveSessions(data);
          setLoading(false);
        },
        err => { console.error(err); setLoading(false); }
      );

    // Load this student's check-in history
    const unsubRecords = firestore.collection('studentAttendance')
      .where('studentId', '==', user.uid)
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

          // Track which sessions this student already signed into
          const signed = new Set(data.map(r => r.sessionId).filter(Boolean));
          setSignedInSessions(signed);

          const present = data.filter(r => r.present).length;
          setSummary({ total: data.length, present, absent: data.length - present });
        },
        err => console.error(err)
      );

    return () => { unsubSessions(); unsubRecords(); };
  }, []);

  const handleSignIn = async (session) => {
    if (signedInSessions.has(session.id)) {
      Alert.alert('Already Signed In', 'You have already signed in to this session.');
      return;
    }
    setSigningIn(session.id);
    try {
      await firestore.collection('studentAttendance').add({
        sessionId: session.id,
        studentId: user.uid,
        studentEmail: user.email,
        studentName: user.displayName || user.email,
        courseCode: session.courseCode,
        lecturerEmail: session.lecturerEmail,
        date: session.date,
        venue: session.venue || '',
        present: true,
        createdAt: new Date(),
      });
      Alert.alert('✅ Signed In', `You are marked present for ${session.courseCode}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSigningIn(null);
    }
  };

  const overallPct = summary.total > 0
    ? Math.round((summary.present / summary.total) * 100)
    : 0;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1a56db" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'checkin' && styles.tabBtnActive]}
          onPress={() => setTab('checkin')}
        >
          <Text style={[styles.tabText, tab === 'checkin' && styles.tabTextActive]}>
            Sign In {activeSessions.length > 0 && (
              <Text style={styles.tabBadge}> {activeSessions.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            My Records
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'checkin' ? (
        <FlatList
          data={activeSessions}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Active Sessions</Text>
              <Text style={styles.emptySub}>
                Your lecturer hasn't opened an attendance session yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const alreadySigned = signedInSessions.has(item.id);
            return (
              <View style={[styles.sessionCard, alreadySigned && styles.sessionCardSigned]}>
                <View style={styles.sessionLeft}>
                  <View style={styles.courseCodeBadge}>
                    <Text style={styles.courseCodeText}>{item.courseCode}</Text>
                  </View>
                  <Text style={styles.sessionLecturer}>
                    👨‍🏫 {item.lecturerName || item.lecturerEmail}
                  </Text>
                  <Text style={styles.sessionMeta}>📅 {item.date}</Text>
                  {item.venue ? (
                    <Text style={styles.sessionMeta}>📍 {item.venue}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.signInBtn,
                    alreadySigned && styles.signInBtnDone,
                  ]}
                  onPress={() => !alreadySigned && handleSignIn(item)}
                  disabled={alreadySigned || signingIn === item.id}
                >
                  {signingIn === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : alreadySigned ? (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.signInBtnText}>Signed In</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="finger-print-outline" size={18} color="#fff" />
                      <Text style={styles.signInBtnText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      ) : (
        <>
        
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overall Attendance</Text>
            <Text style={[
              styles.summaryPct,
              { color: overallPct >= 75 ? '#059669' : '#ef4444' }
            ]}>
              {overallPct}%
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.total}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>{summary.present}</Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{summary.absent}</Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                {
                  width: `${overallPct}%`,
                  backgroundColor: overallPct >= 75 ? '#059669' : '#ef4444',
                }
              ]} />
            </View>
            {overallPct < 75 && summary.total > 0 && (
              <Text style={styles.warning}>
                ⚠️ Your attendance is below 75%. Please attend more classes.
              </Text>
            )}
          </View>

          <FlatList
            data={records}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.card,
                item.present ? styles.cardPresent : styles.cardAbsent,
              ]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.courseCode}>{item.courseCode}</Text>
                  <View style={[
                    styles.badge,
                    item.present ? styles.badgePresent : styles.badgeAbsent,
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      item.present ? styles.badgeTextPresent : styles.badgeTextAbsent,
                    ]}>
                      {item.present ? 'Present' : 'Absent'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>📅 {item.date}</Text>
                {item.venue ? <Text style={styles.meta}>📍 {item.venue}</Text> : null}
                <Text style={styles.meta}>👨‍🏫 {item.lecturerEmail}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No attendance records yet.</Text>
            }
          />
        </>
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
  tabBtnActive: { backgroundColor: '#1a56db' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  tabBadge: { color: '#f59e0b', fontWeight: '800' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 6 },

  sessionCard: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 10, elevation: 1,
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: '#1a56db',
  },
  sessionCardSigned: { borderLeftColor: '#059669' },
  sessionLeft: { flex: 1 },
  courseCodeBadge: {
    backgroundColor: '#eff6ff', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  courseCodeText: { fontSize: 14, fontWeight: '800', color: '#1a56db' },
  sessionLecturer: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 3 },
  sessionMeta: { fontSize: 12, color: '#6b7280', marginBottom: 2 },

  signInBtn: {
    backgroundColor: '#1a56db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', flexDirection: 'row', gap: 6,
  },
  signInBtnDone: { backgroundColor: '#059669' },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 14, elevation: 2,
  },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  summaryPct: { fontSize: 42, fontWeight: '900', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', marginBottom: 10 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  progressBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  warning: { fontSize: 12, color: '#ef4444', marginTop: 8, textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8, elevation: 1, borderLeftWidth: 4,
  },
  cardPresent: { borderLeftColor: '#059669' },
  cardAbsent: { borderLeftColor: '#ef4444' },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  courseCode: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgePresent: { backgroundColor: '#dcfce7' },
  badgeAbsent: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextPresent: { color: '#059669' },
  badgeTextAbsent: { color: '#ef4444' },
  meta: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 40, fontSize: 14 },
});