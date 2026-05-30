import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const RequestsScreen = ({ navigation }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/attendance/pending');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching requests queue:', err);
      Alert.alert('Error', 'Could not fetch request logs');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.patch(`/api/admin/attendance/${id}/approve`);
      Alert.alert('Approved ✅', 'Attendance successfully logged.');
      fetchPending();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve request.');
    }
  };

  const handleReject = async (id: string) => {
    if (!reason) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    try {
      await apiClient.patch(`/api/admin/attendance/${id}/reject`, { reason });
      Alert.alert('Rejected ❌', 'Attendance request rejected.');
      setRejectId(null);
      setReason('');
      fetchPending();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject request.');
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const isRejectMode = rejectId === item._id;

    return (
      <View style={[GLASS_STYLES.card, styles.reqCard]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.empName}>{item.userId?.name || 'Unknown Employee'}</Text>
            <Text style={styles.empEmail}>{item.userId?.email || 'No Email'}</Text>
          </View>
          <Text style={styles.dateLabel}>{item.date}</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricVal}>🕒 Time: {item.checkInTime}</Text>
          {item.isLate && <Text style={styles.lateTag}>LATE</Text>}
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricVal}>📍 Distance: {item.latitude}, {item.longitude}</Text>
        </View>

        {isRejectMode ? (
          <View style={styles.rejectArea}>
            <TextInput
              style={[GLASS_STYLES.input, styles.rejectInput]}
              placeholder="Reason for rejection (e.g. Geofence mismatch)"
              placeholderTextColor="#666"
              value={reason}
              onChangeText={setReason}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={[GLASS_STYLES.button, styles.cancelBtn]} onPress={() => setRejectId(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[GLASS_STYLES.button, styles.confirmRejectBtn]} onPress={() => handleReject(item._id)}>
                <Text style={styles.confirmRejectText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <TouchableOpacity style={[GLASS_STYLES.button, styles.rejectBtn]} onPress={() => setRejectId(item._id)}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[GLASS_STYLES.button, styles.approveBtn]} onPress={() => handleApprove(item._id)}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pending Queue</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>All requests reviewed! Queue empty.</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  reqCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  empEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricVal: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  lateTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderColor: COLORS.danger,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectArea: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 12,
  },
  rejectInput: {
    marginBottom: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  confirmRejectBtn: {
    flex: 1.5,
    backgroundColor: COLORS.danger,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRejectText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default RequestsScreen;
