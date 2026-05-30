import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const HistoryScreen = ({ navigation }: any) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'APPROVED', 'PENDING', 'REJECTED'

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/my-attendance', {
        params: { status: statusFilter || undefined }
      });
      setRecords(res.data);
    } catch (err) {
      console.error('Error fetching calendar history:', err);
      Alert.alert('Error', 'Could not load your history logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[GLASS_STYLES.card, styles.itemCard]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>{item.date}</Text>
        <View style={[styles.badge, item.status === 'APPROVED' ? styles.badgeSuccess : item.status === 'REJECTED' ? styles.badgeDanger : styles.badgeWarning]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>🕒 Checked In: {item.checkInTime}</Text>
        {item.isLate && <Text style={styles.lateTag}>LATE</Text>}
      </View>
      {item.rejectionReason && (
        <Text style={styles.rejectText}>⚠️ Reason: {item.rejectionReason}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance History</Text>
      </View>

      {/* Filter Chips Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === '' && styles.filterChipActive]}
          onPress={() => setStatusFilter('')}
        >
          <Text style={[styles.filterChipText, statusFilter === '' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'APPROVED' && styles.filterChipActive]}
          onPress={() => setStatusFilter('APPROVED')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'APPROVED' && styles.filterChipTextActive]}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'PENDING' && styles.filterChipActive]}
          onPress={() => setStatusFilter('PENDING')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'PENDING' && styles.filterChipTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'REJECTED' && styles.filterChipActive]}
          onPress={() => setStatusFilter('REJECTED')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'REJECTED' && styles.filterChipTextActive]}>Rejected</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No check-in logs found matching filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    paddingRight: 16,
  },
  backText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(90, 97, 246, 0.1)',
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  itemCard: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successBg,
  },
  badgeWarning: {
    backgroundColor: COLORS.warningBg,
  },
  badgeDanger: {
    backgroundColor: COLORS.dangerBg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  lateTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.danger,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rejectText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.danger,
    fontStyle: 'italic',
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
});

export default HistoryScreen;
