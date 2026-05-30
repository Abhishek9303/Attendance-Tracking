import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const EmployeeRecordsScreen = ({ navigation }: any) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEmployees = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/employees', {
        params: { search: search || undefined },
      });
      setEmployees(res.data);
    } catch (err) {
      console.error('Error loading employee catalog:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Simple search debounce
    const delayDebounce = setTimeout(() => {
      fetchEmployees(true);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmployees(false);
  }, [search]);

  const getAvatarInitials = (name: string) => {
    if (!name) return 'EE';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderItem = ({ item }: { item: any }) => {
    const rate = item.attendanceRate || 0;
    const rateColor = rate >= 90 
      ? COLORS.success 
      : rate >= 75 
        ? COLORS.warning 
        : COLORS.danger;

    return (
      <TouchableOpacity
        style={[GLASS_STYLES.card, styles.empCard]}
        onPress={() => navigation.navigate('EmployeeAttendanceDetails', { employeeId: item.employee._id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          {/* Avatar Vibe */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarInitials(item.employee.name)}</Text>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.empName}>{item.employee.name}</Text>
            <Text style={styles.empEmail}>✉️ {item.employee.email}</Text>
            <Text style={styles.empPhone}>📞 {item.employee.phone}</Text>
          </View>

          <View style={styles.rateWrapper}>
            <Text style={styles.rateLabel}>Attendance</Text>
            <Text style={[styles.rateVal, { color: rateColor }]}>{rate}%</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Quick Month Metrics Grid */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: COLORS.success }]}>Present</Text>
            <Text style={styles.metricVal}>{item.stats.present}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: COLORS.warning }]}>Late</Text>
            <Text style={styles.metricVal}>{item.stats.late}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: COLORS.danger }]}>Leave</Text>
            <Text style={styles.metricVal}>{item.stats.leave}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: COLORS.textSecondary }]}>Working</Text>
            <Text style={styles.metricVal}>{item.stats.workingDays}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Employee Tracking</Text>
      </View>

      {/* Premium Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[GLASS_STYLES.input, styles.searchInput]}
          placeholder="Search employees by name..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.employee._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No employees found</Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    paddingVertical: 10,
    fontSize: 14,
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
  empCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(90, 97, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(90, 97, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailsContainer: {
    flex: 1,
    gap: 2,
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  empEmail: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  empPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rateWrapper: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  rateVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
});

export default EmployeeRecordsScreen;
