import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import io from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const UserDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<any>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        apiClient.get('/api/attendance/history'),
        apiClient.get('/api/attendance/my-attendance'),
      ]);
      setStats(statsRes.data);

      // Check if user has already checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayItem = historyRes.data.find((item: any) => item.date === todayStr);
      setTodayRecord(todayItem || null);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Setup real-time Socket.IO synchronization gateway
    const socket = io('http://localhost:5001');

    if (user) {
      socket.emit('register', user.id);
    }

    socket.on('attendanceStatusUpdate', (data: any) => {
      // Prompt user with nice alert modal
      Alert.alert(
        '🔔 Real-time Status Sync',
        `Your check-in status is now updated to: ${data.status}`
      );
      fetchDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row cards */}
      <View style={styles.statsRow}>
        <View style={[GLASS_STYLES.card, styles.statCard]}>
          <Text style={styles.statLabel}>Checked-in</Text>
          <Text style={styles.statVal}>{stats?.totalDays || 0}d</Text>
        </View>
        <View style={[GLASS_STYLES.card, styles.statCard]}>
          <Text style={styles.statLabel}>Lateness</Text>
          <Text style={[styles.statVal, { color: COLORS.danger }]}>{stats?.lateDays || 0}d</Text>
        </View>
        <View style={[GLASS_STYLES.card, styles.statCard]}>
          <Text style={styles.statLabel}>Rate %</Text>
          <Text style={[styles.statVal, { color: COLORS.success }]}>{stats?.attendancePercentage || 0}%</Text>
        </View>
      </View>

      {/* Main check-in actions */}
      <View style={[GLASS_STYLES.card, styles.actionCard]}>
        <Text style={styles.sectionTitle}>Daily Verification</Text>
        <Text style={styles.sectionDesc}>
          Mark your daily coordinate tracking and selfie verification to establish office logs.
        </Text>

        {todayRecord ? (
          <View style={[styles.statusBox, todayRecord.status === 'APPROVED' ? styles.statusBoxApproved : todayRecord.status === 'REJECTED' ? styles.statusBoxRejected : styles.statusBoxPending]}>
            <Text style={styles.statusBoxLabel}>Today's Submission:</Text>
            <Text style={styles.statusBoxVal}>{todayRecord.status}</Text>
            {todayRecord.isLate && <Text style={styles.lateBadge}>LATE CHECK-IN</Text>}
            {todayRecord.rejectionReason && (
              <Text style={styles.rejectionReason}>Reason: {todayRecord.rejectionReason}</Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[GLASS_STYLES.button, styles.checkInBtn]}
            onPress={() => navigation.navigate('MarkAttendance')}
          >
            <Text style={styles.checkInBtnText}>✦ Start Check-In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Fast navigation links */}
      <View style={styles.navRow}>
        <TouchableOpacity style={[GLASS_STYLES.card, styles.navCard]} onPress={() => navigation.navigate('History')}>
          <Text style={styles.navCardTitle}>📅 Attendance Logs</Text>
          <Text style={styles.navCardDesc}>Filter & check full past calendar logs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greet: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoutBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  actionCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  checkInBtn: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  checkInBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBoxPending: {
    backgroundColor: COLORS.warningBg,
  },
  statusBoxApproved: {
    backgroundColor: COLORS.successBg,
  },
  statusBoxRejected: {
    backgroundColor: COLORS.dangerBg,
  },
  statusBoxLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusBoxVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  lateBadge: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: 'bold',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  rejectionReason: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
    fontStyle: 'italic',
  },
  navRow: {
    gap: 12,
  },
  navCard: {
    padding: 18,
  },
  navCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  navCardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default UserDashboard;
