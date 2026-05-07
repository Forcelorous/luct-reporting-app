import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../services/FirebaseConfig';
import { getReportsByLecturer } from '../../services/api';
import { exportToCSV } from '../../utils/ExcelExport';

export default function MyReports({ navigation }) {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!search.trim()) { 
      setFiltered(reports); 
      return; 
    }
    const q = search.toLowerCase();
    setFiltered(reports.filter(r =>
      r.courseCode?.toLowerCase().includes(q) ||
      r.courseName?.toLowerCase().includes(q) ||
      r.topicTaught?.toLowerCase().includes(q) ||
      r.dateOfLecture?.toLowerCase().includes(q) ||
      r.venue?.toLowerCase().includes(q) ||
      r.weekOfReporting?.toLowerCase().includes(q)
    ));
  }, [search, reports]);

  const loadReports = async () => {
    if (!user || !user.email) {
      setReports([]);
      setFiltered([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getReportsByLecturer(user.email);
      setReports(data);
      setFiltered(data);
    } catch (error) {
      console.error('loadReports error:', error);
      Alert.alert('Error', 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (reports.length === 0) {
      Alert.alert('Nothing to export', 'No reports available.');
      return;
    }
    setExporting(true);
    try {
      const result = await exportToCSV(reports, 'my_reports.csv');
      if (result && !result.success) Alert.alert('Export Failed', result.error);
    } catch (error) {
      Alert.alert('Export Failed', error.message);
    } finally {
      setExporting(false);
    }
  };

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loaderText}>Loading your reports...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color="#d1d5db" />
        <Text style={styles.loaderText}>Please log in to view your reports.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadReports}>
          <Ionicons name="refresh-outline" size={18} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Ionicons name="download-outline" size={16} color="#000000" />
              <Text style={styles.exportText}>Export CSV</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by course, topic, date, venue..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>
        My Reports ({filtered.length}{search ? ` of ${reports.length}` : ''})
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {search ? 'No matching reports' : 'No reports submitted yet'}
            </Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term.' : 'Submit your first report using the Report tab.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isOpen = expanded[item.id];
          const present = item.actualStudentsPresent ?? item.actualStudents ?? '—';
          const total = item.totalRegisteredStudents ?? item.registeredStudents ?? '—';
          const attendanceRate = (total && total !== '—' && present && present !== '—')
            ? Math.round((Number(present) / Number(total)) * 100)
            : null;

          return (
            <TouchableOpacity
              style={[styles.card, isOpen && styles.cardOpen]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.courseCode}>{item.courseCode}</Text>
                  <Text style={styles.courseName}>{item.courseName}</Text>
                  <Text style={styles.date}>📅 {item.dateOfLecture}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <View style={styles.weekBadge}>
                    <Text style={styles.weekText}>{item.weekOfReporting}</Text>
                  </View>
                  {item.feedback && (
                    <View style={styles.feedbackBadge}>
                      <Text style={styles.feedbackBadgeText}>Feedback ✓</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.topic} numberOfLines={isOpen ? undefined : 1}>
                📚 {item.topicTaught}
              </Text>

              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Ionicons name="people-outline" size={13} color="#6b7280" />
                  <Text style={styles.quickStatText}>{present} / {total}</Text>
                </View>
                {attendanceRate !== null && (
                  <Text style={[
                    styles.ratePill,
                    attendanceRate >= 75
                      ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                      : { backgroundColor: '#fef2f2', color: '#ef4444' },
                  ]}>
                    {attendanceRate}%
                  </Text>
                )}
                <View style={styles.quickStat}>
                  <Ionicons name="location-outline" size={13} color="#6b7280" />
                  <Text style={styles.quickStatText}>{item.venue}</Text>
                </View>
              </View>

              {isOpen && (
                <View style={styles.details}>
                  <Detail label="Faculty" value={item.facultyName} />
                  <Detail label="Class" value={item.className} />
                  <Detail label="Venue" value={item.venue} />
                  <Detail label="Scheduled Time" value={item.scheduledTime} />
                  <Detail label="Students Present" value={`${present} / ${total}`} />
                  <Detail label="Topic Taught" value={item.topicTaught} />
                  <Detail label="Learning Outcomes" value={item.learningOutcomes} />
                  {item.recommendations ? <Detail label="Recommendations" value={item.recommendations} /> : null}
                  {item.feedback && (
                    <View style={styles.feedbackBox}>
                      <Text style={styles.feedbackLabel}>PRL Feedback</Text>
                      <Text style={styles.feedbackText}>{item.feedback}</Text>
                      {item.feedbackBy && (
                        <Text style={styles.feedbackBy}>— {item.feedbackBy}</Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.tapHint}>
                {isOpen ? 'Tap to collapse ▲' : 'Tap to expand ▼'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const Detail = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loaderText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 16, marginHorizontal: 16, marginBottom: 12 },
  refreshBtn: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  exportBtnDisabled: { opacity: 0.5 },
  exportText: { fontSize: 13, color: '#000000', fontWeight: '600' },
  
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 16, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginLeft: 16, marginBottom: 10 },
  
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#f3f4f6' },
  cardOpen: { borderColor: '#000000', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardHeaderLeft: { flex: 1 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 5 },
  courseCode: { fontSize: 16, fontWeight: '800', color: '#000000' },
  courseName: { fontSize: 13, color: '#374151', fontWeight: '500', marginTop: 1 },
  date: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  weekBadge: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  weekText: { fontSize: 12, color: '#000000', fontWeight: '700' },
  feedbackBadge: { backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  feedbackBadgeText: { fontSize: 11, color: '#16a34a', fontWeight: '700' },
  topic: { fontSize: 13, color: '#374151', marginBottom: 8, lineHeight: 18 },
  quickStats: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickStatText: { fontSize: 12, color: '#6b7280' },
  ratePill: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  details: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 8 },
  detailRow: { flexDirection: 'row', marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', width: 140 },
  detailValue: { fontSize: 12, color: '#374151', flex: 1, lineHeight: 18 },
  feedbackBox: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#fde68a', borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  feedbackLabel: { fontSize: 12, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  feedbackText: { fontSize: 13, color: '#78350f', lineHeight: 18 },
  feedbackBy: { fontSize: 11, color: '#92400e', marginTop: 6, fontStyle: 'italic', textAlign: 'right' },
  tapHint: { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 8 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});