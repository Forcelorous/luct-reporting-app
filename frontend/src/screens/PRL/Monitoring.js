import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { firestore } from '../../services/FirebaseConfig';

export default function PRLMonitoring() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore.collection('reports').onSnapshot(
      snap => { setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err => { console.error(err); setLoading(false); }
    );
    return unsubscribe;
  }, []);

  const totalReports = reports.length;
  const avgAtt = totalReports > 0
    ? Math.round(reports.reduce((sum, r) => {
        const t = Number(r.totalStudents) || 0, a = Number(r.actualStudents) || 0;
        return sum + (t > 0 ? (a / t) * 100 : 0);
      }, 0) / totalReports)
    : 0;
  const withFeedback = reports.filter(r => r.prlFeedback).length;

  // Group by lecturer
  const byLecturer = reports.reduce((acc, r) => {
    const key = r.lecturerName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#1a56db" /></View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Stream Monitoring</Text>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: '#1a56db' }]}>
          <Text style={styles.cardNum}>{totalReports}</Text>
          <Text style={styles.cardLabel}>Total Reports</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#059669' }]}>
          <Text style={styles.cardNum}>{avgAtt}%</Text>
          <Text style={styles.cardLabel}>Avg Attendance</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#7c3aed' }]}>
          <Text style={styles.cardNum}>{withFeedback}</Text>
          <Text style={styles.cardLabel}>Feedbacks Given</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>By Lecturer</Text>
      {Object.entries(byLecturer).map(([lecturer, rpts]) => {
        const lAvg = Math.round(rpts.reduce((sum, r) => {
          const t = Number(r.totalStudents) || 0, a = Number(r.actualStudents) || 0;
          return sum + (t > 0 ? (a / t) * 100 : 0);
        }, 0) / rpts.length);
        return (
          <View key={lecturer} style={styles.lecturerCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.lecturerName}>👨‍🏫 {lecturer}</Text>
              <Text style={styles.pct}>{lAvg}%</Text>
            </View>
            <Text style={styles.detail}>Reports: {rpts.length}</Text>
            <Text style={styles.detail}>Courses: {[...new Set(rpts.map(r => r.courseName))].join(', ')}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                flex: lAvg, backgroundColor: lAvg >= 75 ? '#059669' : '#f59e0b'
              }]} />
              <View style={{ flex: 100 - lAvg }} />
            </View>
          </View>
        );
      })}
      {Object.keys(byLecturer).length === 0 && (
        <Text style={styles.empty}>No data yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  card: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  cardNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  cardLabel: { fontSize: 10, color: '#e5e7eb', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  lecturerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lecturerName: { fontSize: 15, fontWeight: '700', color: '#1a56db', flex: 1 },
  pct: { fontSize: 15, fontWeight: '800', color: '#111827' },
  detail: { fontSize: 13, color: '#374151', marginBottom: 2 },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden', flexDirection: 'row', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
});