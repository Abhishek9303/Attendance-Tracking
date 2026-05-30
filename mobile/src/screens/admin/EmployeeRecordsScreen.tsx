import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const EmployeeRecordsScreen = ({ navigation }: any) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/employees', {
        params: { search: search || undefined },
      });
      setEmployees(res.data);
    } catch (err) {
      console.error('Error loading employee catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[GLASS_STYLES.card, styles.empCard]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.empName}>{item.employee.name}</Text>
          <Text style={styles.empPhone}>📞 {item.employee.phone}</Text>
        </View>
        <View style={styles.statContainer}>
          <Text style={styles.rateLabel}>Presence</Text>
          <Text style={[styles.rateVal, item.attendanceRate > 75 ? { color: COLORS.success } : { color: COLORS.warning }]}>
            {item.attendanceRate}%
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Submitted</Text>
          <Text style={styles.metricVal}>{item.stats.total}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Approved</Text>
          <Text style={styles.metricVal}>{item.stats.approved}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={styles.metricVal}>{item.stats.pending}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Employee Catalog</Text>
      </View>

      {/* Modern Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[GLASS_STYLES.input, styles.searchInput]}
          placeholder="Search staff members by name..."
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
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No employees found matching criteria</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  empPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statContainer: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 10,
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
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
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
