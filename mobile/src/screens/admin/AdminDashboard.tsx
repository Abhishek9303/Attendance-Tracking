import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import io from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const AdminDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error loading admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Listen to real-time new request alerts using Socket.IO
    const socket = io('http://localhost:5001');

    socket.on('newAttendanceRequest', (data: any) => {
      Alert.alert(
        '🔔 Real-time Submission',
        `New request submitted by ${data.employeeName} at ${data.checkInTime}!`
      );
      fetchDashboardStats(); // Refresh numbers immediately!
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading && !dashboardData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const { cards, analytics } = dashboardData || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Security Console,</Text>
          <Text style={styles.name}>{user?.name} (Admin)</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard cards grid */}
      <View style={styles.grid}>
        <View style={[GLASS_STYLES.card, styles.gridCard]}>
          <Text style={styles.cardLabel}>Total staff</Text>
          <Text style={styles.cardVal}>{cards?.totalEmployees || 0}</Text>
        </View>
        <View style={[GLASS_STYLES.card, styles.gridCard, cards?.pendingRequests > 0 && { borderColor: COLORS.warning }]}>
          <Text style={styles.cardLabel}>Pending requests</Text>
          <Text style={[styles.cardVal, cards?.pendingRequests > 0 && { color: COLORS.warning }]}>
            {cards?.pendingRequests || 0}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[GLASS_STYLES.card, styles.gridCard]}>
          <Text style={styles.cardLabel}>Approved today</Text>
          <Text style={[styles.cardVal, { color: COLORS.success }]}>{cards?.approvedToday || 0}</Text>
        </View>
        <View style={[GLASS_STYLES.card, styles.gridCard]}>
          <Text style={styles.cardLabel}>Rejected today</Text>
          <Text style={[styles.cardVal, { color: COLORS.danger }]}>{cards?.rejectedToday || 0}</Text>
        </View>
      </View>

      {/* Visual Analytics Simulation (Cred-like) */}
      <View style={[GLASS_STYLES.card, styles.chartCard]}>
        <Text style={styles.chartTitle}>7-Day Check-in Analytics</Text>
        <View style={styles.chartContainer}>
          {analytics?.dailyAttendanceChart?.map((item: any, idx: number) => {
            const maxVal = Math.max(...analytics.dailyAttendanceChart.map((d: any) => d.approved + d.rejected), 1);
            const approvedHeight = (item.approved / maxVal) * 100;
            const rejectedHeight = (item.rejected / maxVal) * 100;

            return (
              <View key={idx} style={styles.chartCol}>
                <View style={styles.barStack}>
                  <View style={[styles.barApproved, { height: `${approvedHeight}%` }]} />
                  <View style={[styles.barRejected, { height: `${rejectedHeight}%` }]} />
                </View>
                <Text style={styles.chartDateLabel}>{item.date.slice(-2)}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Approved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Rejected</Text>
          </View>
        </View>
      </View>

      {/* Navigation options */}
      <View style={styles.actions}>
        <TouchableOpacity style={[GLASS_STYLES.card, styles.actionLink]} onPress={() => navigation.navigate('Requests')}>
          <Text style={styles.actionTitle}>📥 Pending Request Queue</Text>
          <Text style={styles.actionDesc}>Review and approve/reject active employee loggings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[GLASS_STYLES.card, styles.actionLink]} onPress={() => navigation.navigate('Employees')}>
          <Text style={styles.actionTitle}>👥 Employee Directory</Text>
          <Text style={styles.actionDesc}>Review individual staff attendance logs & percentages</Text>
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
  center: {
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
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  chartCard: {
    padding: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 8,
    marginBottom: 12,
  },
  chartCol: {
    alignItems: 'center',
    width: '12%',
  },
  barStack: {
    width: 10,
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  barApproved: {
    width: '100%',
    backgroundColor: COLORS.success,
  },
  barRejected: {
    width: '100%',
    backgroundColor: COLORS.danger,
  },
  chartDateLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  actions: {
    gap: 12,
  },
  actionLink: {
    padding: 18,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default AdminDashboard;
