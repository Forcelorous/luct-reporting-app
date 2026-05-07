import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../services/FirebaseConfig';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';

export default function ViewAttendance({ navigation }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(null);
  const [tab, setTab] = useState('checkin');
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });
  const [signedInSessions, setSignedInSessions] = useState(new Set());
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const qSessions = query(collection(db, 'attendanceSessions'), where('isOpen', '==', true));
    const unsubSessions = onSnapshot(qSessions, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveSessions(data);
      setLoading(false);
    });

    const qRecords = query(collection(db, 'studentAttendance'), where('studentId', '==', user.uid));
    const unsubRecords = onSnapshot(qRecords, snapshot => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aT = a.createdAt?.toDate?.() || new Date(0);
          const bT = b.createdAt?.toDate?.() || new Date(0);
          return bT - aT;
        });
      setRecords(data);
      const signed = new Set(data.map(r => r.sessionId).filter(Boolean));
      setSignedInSessions(signed);
      const present = data.filter(r => r.present).length;
      setSummary({ total: data.length, present, absent: data.length - present });
    });

    return () => { unsubSessions(); unsubRecords(); };
  }, [user]);

  const handleSignIn = async (session) => {
    if (!user) return Alert.alert('Error', 'User not authenticated');
    if (signedInSessions.has(session.id)) {
      return Alert.alert('Already Signed In', 'You have already signed in to this session.');
    }
    setSigningIn(session.id);
    try {
      await addDoc(collection(db, 'studentAttendance'), {
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
      Alert.alert('Signed In', `You are marked present for ${session.courseCode}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSigningIn(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'checkin' && styles.tabActive]}
          onPress={() => setTab('checkin')}
        >
          <Ionicons name="finger-print" size={16} color={tab === 'checkin' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, tab === 'checkin' && styles.tabTextActive]}>Check-In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Ionicons name="time-outline" size={16} color={tab === 'history' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'summary' && styles.tabActive]}
          onPress={() => setTab('summary')}
        >
          <Ionicons name="stats-chart-outline" size={16} color={tab === 'summary' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, tab === 'summary' && styles.tabTextActive]}>Summary</Text>
        </TouchableOpacity>
      </View>

      {tab === 'checkin' && (
        <FlatList
          data={activeSessions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseCode}>{item.courseCode}</Text>
                <View style={[styles.statusBadge, signedInSessions.has(item.id) && styles.statusSigned]}>
                  <Text style={styles.statusText}>
                    {signedInSessions.has(item.id) ? 'Signed In' : 'Open'}
                  </Text>
                </View>
              </View>
              <Text style={styles.courseName}>{item.courseName || 'Course Session'}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color="#666" />
                <Text style={styles.meta}>Lecturer: {item.lecturerEmail}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.meta}>Date: {item.date}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.meta}>Venue: {item.venue || '—'}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.signInBtn, 
                  signedInSessions.has(item.id) && styles.signInBtnDisabled
                ]}
                disabled={signedInSessions.has(item.id) || signingIn === item.id}
                onPress={() => handleSignIn(item)}
              >
                <Ionicons name="finger-print" size={24} color="#ffffff" />
                <Text style={styles.signInText}>
                  {signedInSessions.has(item.id) ? 'Already Signed In' :
                    signingIn === item.id ? 'Signing In...' : 'Sign In with Fingerprint'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.empty}>No active sessions available.</Text>
            </View>
          }
        />
      )}

      {tab === 'history' && (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseCode}>{item.courseCode}</Text>
                <View style={[styles.statusBadge, item.present ? styles.statusPresent : styles.statusAbsent]}>
                  <Text style={styles.statusText}>
                    {item.present ? 'Present' : 'Absent'}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.meta}>{item.date}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.meta}>Venue: {item.venue || '—'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.meta}>
                  {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleString() : ''}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.empty}>No attendance records yet.</Text>
            </View>
          }
        />
      )}

      {tab === 'summary' && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Attendance Summary</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Sessions:</Text>
            <Text style={styles.summaryValue}>{summary.total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Present:</Text>
            <Text style={[styles.summaryValue, styles.summaryPresent]}>{summary.present}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Absent:</Text>
            <Text style={[styles.summaryValue, styles.summaryAbsent]}>{summary.absent}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Attendance Rate:</Text>
            <Text style={styles.summaryRate}>
              {summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: '#f5f5f5', gap: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ffffff', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  tabActive: { backgroundColor: '#13ec4a', borderColor: '#000000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666666', textAlign: 'center' },
  tabTextActive: { color: '#ffffff' },
  
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0', shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  courseCode: { fontSize: 18, fontWeight: 'bold', color: '#f51414' },
  courseName: { fontSize: 14, color: '#555555', marginBottom: 10 },
  statusBadge: { backgroundColor: '#5ccf0f', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusSigned: { backgroundColor: '#df1710' },
  statusPresent: { backgroundColor: '#1af92c' },
  statusAbsent: { backgroundColor: '#ff0b30' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#333333' },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  meta: { fontSize: 13, color: '#666666' },
  
  signInBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#48fd16', paddingVertical: 14, borderRadius: 10, marginTop: 12 },
  signInBtnDisabled: { backgroundColor: '#cccccc' },
  signInText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  empty: { textAlign: 'center', color: '#999999', fontSize: 14, marginTop: 12 },
  
  summaryCard: { backgroundColor: '#0b0b0b', borderRadius: 12, margin: 16, padding: 20, borderWidth: 1, borderColor: '#e0e0e0' },
  summaryTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 16 },
  summaryDivider: { height: 1, backgroundColor: '#e0cece', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 15, color: '#afa5a5', fontWeight: '500' },
  summaryValue: { fontSize: 16, fontWeight: '600', color: '#000000' },
  summaryPresent: { color: '#2e7d32' },
  summaryAbsent: { color: '#c62828' },
  summaryRate: { fontSize: 18, fontWeight: 'bold', color: '#1148ff' },
});