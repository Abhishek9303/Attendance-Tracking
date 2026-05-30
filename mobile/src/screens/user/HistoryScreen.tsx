import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

const { width } = Dimensions.get('window');

const MONTHS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const YEARS = [2024, 2025, 2026];

export const HistoryScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dropdown states
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  // Data states
  const [employee, setEmployee] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);

  // Bottom Sheet state
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null);

  const fetchDetails = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/my-details', {
        params: { month: selectedMonth, year: selectedYear },
      });
      setEmployee(res.data.employee);
      setSummary(res.data.summary);
      setAttendance(res.data.attendance);
    } catch (err) {
      console.error('Error fetching own history details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetails(true);
  }, [selectedMonth, selectedYear]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetails(false);
  }, [selectedMonth, selectedYear]);

  const getAvatarInitials = (name: string) => {
    if (!name) return 'EE';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TIME':
        return COLORS.success;
      case 'LATE':
        return COLORS.warning;
      case 'LEAVE':
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderCalendar = () => {
    const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const calendarCells: any[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push({ key: `empty-${i}`, isPlaceholder: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = String(day).padStart(2, '0');
      const formattedMonth = String(selectedMonth).padStart(2, '0');
      const dateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;

      const record = attendance.find((r) => r.date === dateStr);
      let dayStatus = 'ABSENT';
      let dayRecord = null;

      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (record) {
        dayStatus = record.status;
        dayRecord = record;
      } else if (isWeekend) {
        dayStatus = 'WEEKEND';
      }

      calendarCells.push({
        key: `day-${day}`,
        dayNum: day,
        dateStr,
        status: dayStatus,
        record: dayRecord,
        isWeekend,
      });
    }

    return (
      <View style={[GLASS_STYLES.card, styles.calendarCard]}>
        <View style={styles.calendarWeekRow}>
          {daysInWeek.map((day) => (
            <Text key={day} style={styles.calendarWeekText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarCells.map((cell, index) => {
            if (cell.isPlaceholder) {
              return <View key={cell.key} style={styles.calendarCellEmpty} />;
            }

            let cellBg = 'rgba(255, 255, 255, 0.03)';
            let borderStyle = {};
            let textColor = COLORS.textPrimary;

            if (cell.status === 'ON_TIME') {
              cellBg = 'rgba(16, 185, 129, 0.15)';
              borderStyle = { borderColor: COLORS.success, borderWidth: 1 };
            } else if (cell.status === 'LATE') {
              cellBg = 'rgba(245, 158, 11, 0.15)';
              borderStyle = { borderColor: COLORS.warning, borderWidth: 1 };
            } else if (cell.status === 'LEAVE') {
              cellBg = 'rgba(239, 68, 68, 0.15)';
              borderStyle = { borderColor: COLORS.danger, borderWidth: 1 };
            } else if (cell.status === 'ABSENT' && !cell.isWeekend) {
              cellBg = 'rgba(138, 138, 147, 0.08)';
              borderStyle = { borderColor: 'rgba(138, 138, 147, 0.2)', borderWidth: 1 };
              textColor = COLORS.textSecondary;
            } else if (cell.isWeekend) {
              textColor = '#444';
            }

            return (
              <TouchableOpacity
                key={cell.key}
                style={[styles.calendarCell, { backgroundColor: cellBg }, borderStyle]}
                onPress={() => {
                  if (cell.record) {
                    setSelectedDayDetail(cell.record);
                  } else if (cell.status === 'ABSENT' && !cell.isWeekend) {
                    setSelectedDayDetail({
                      date: cell.dateStr,
                      status: 'ABSENT',
                      clockInTime: 'N/A',
                      remarks: 'No check-in record found. Absent.',
                      approvalStatus: 'N/A',
                    });
                  }
                }}
                disabled={cell.isWeekend}
              >
                <Text style={[styles.calendarCellNum, { color: textColor }]}>
                  {cell.dayNum}
                </Text>
                {!cell.isWeekend && (
                  <View
                    style={[
                      styles.calendarCellDot,
                      {
                        backgroundColor:
                          cell.status === 'ON_TIME'
                            ? COLORS.success
                            : cell.status === 'LATE'
                              ? COLORS.warning
                              : cell.status === 'LEAVE'
                                ? COLORS.danger
                                : COLORS.textSecondary,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPremiumAnalytics = () => {
    if (!summary) return null;
    const { presentDays, lateDays, leaveDays, absentDays } = summary;
    const total = presentDays + lateDays + leaveDays + absentDays;

    if (total === 0) return null;

    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const pct = summary.attendancePercentage || 0;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <View style={[GLASS_STYLES.card, styles.analyticsCard]}>
        <Text style={styles.analyticsTitle}>Monthly Insights</Text>

        <View style={styles.analyticsRow}>
          <View style={styles.chartContainer}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={COLORS.accent}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={styles.chartTextWrapper}>
              <Text style={styles.chartPercentage}>{pct}%</Text>
              <Text style={styles.chartSubLabel}>Rate</Text>
            </View>
          </View>

          <View style={styles.barsContainer}>
            <View style={styles.barItem}>
              <Text style={styles.barLabel}>Present ({presentDays})</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(presentDays / total) * 100}%`, backgroundColor: COLORS.success },
                  ]}
                />
              </View>
            </View>

            <View style={styles.barItem}>
              <Text style={styles.barLabel}>Late ({lateDays})</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(lateDays / total) * 100}%`, backgroundColor: COLORS.warning },
                  ]}
                />
              </View>
            </View>

            <View style={styles.barItem}>
              <Text style={styles.barLabel}>Leave ({leaveDays})</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(leaveDays / total) * 100}%`, backgroundColor: COLORS.danger },
                  ]}
                />
              </View>
            </View>

            <View style={styles.barItem}>
              <Text style={styles.barLabel}>Absent ({absentDays})</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(absentDays / total) * 100}%`, backgroundColor: COLORS.textSecondary },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Attendance Logs</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
        >
          {employee && (
            <View style={[GLASS_STYLES.card, styles.profileCard]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getAvatarInitials(employee.name)}</Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{employee.name}</Text>
                <Text style={styles.profileContact}>✉️ {employee.email}</Text>
                <Text style={styles.profileContact}>📞 {employee.phone}</Text>
              </View>
            </View>
          )}

          <View style={styles.selectorsRow}>
            <TouchableOpacity
              style={[GLASS_STYLES.card, styles.selectorBtn]}
              onPress={() => setShowMonthModal(true)}
            >
              <Text style={styles.selectorLabel}>Month</Text>
              <Text style={styles.selectorValue}>
                {MONTHS.find((m) => m.value === selectedMonth)?.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[GLASS_STYLES.card, styles.selectorBtn]}
              onPress={() => setShowYearModal(true)}
            >
              <Text style={styles.selectorLabel}>Year</Text>
              <Text style={styles.selectorValue}>{selectedYear}</Text>
            </TouchableOpacity>
          </View>

          {summary && (
            <View style={styles.summaryGrid}>
              <View style={[GLASS_STYLES.card, styles.summaryCell]}>
                <Text style={styles.summaryVal}>{summary.presentDays}</Text>
                <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Present</Text>
              </View>
              <View style={[GLASS_STYLES.card, styles.summaryCell]}>
                <Text style={styles.summaryVal}>{summary.lateDays}</Text>
                <Text style={[styles.summaryLabel, { color: COLORS.warning }]}>Late</Text>
              </View>
              <View style={[GLASS_STYLES.card, styles.summaryCell]}>
                <Text style={styles.summaryVal}>{summary.leaveDays}</Text>
                <Text style={[styles.summaryLabel, { color: COLORS.danger }]}>Leaves</Text>
              </View>
              <View style={[GLASS_STYLES.card, styles.summaryCell]}>
                <Text style={styles.summaryVal}>{summary.absentDays}</Text>
                <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Absents</Text>
              </View>
              <View style={[GLASS_STYLES.card, styles.summaryCell, styles.wideCell]}>
                <Text style={styles.summaryVal}>{summary.averageCheckInTime}</Text>
                <Text style={[styles.summaryLabel, { color: COLORS.accent }]}>Avg Clock-In</Text>
              </View>
            </View>
          )}

          {renderPremiumAnalytics()}

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
                List View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
              onPress={() => setViewMode('calendar')}
            >
              <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>
                Calendar View
              </Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'list' ? (
            <View style={styles.listContainer}>
              {attendance.length === 0 ? (
                <View style={styles.emptyView}>
                  <Text style={styles.emptyText}>No attendance records for this month</Text>
                </View>
              ) : (
                attendance.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[GLASS_STYLES.card, styles.timelineCard]}
                    onPress={() => setSelectedDayDetail(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.timelineHeader}>
                      <View>
                        <Text style={styles.timelineDate}>{item.date}</Text>
                        <Text style={styles.timelineDay}>{item.day}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${getStatusColor(item.status)}15` },
                        ]}
                      >
                        <View
                          style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]}
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                          {item.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineClock}>
                        🕒 Clock-in: <Text style={{ color: '#fff' }}>{item.clockInTime}</Text>
                      </Text>
                      <Text style={styles.timelineRemarks} numberOfLines={1}>
                        💬 {item.remarks}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            renderCalendar()
          )}
        </ScrollView>
      )}

      {selectedDayDetail && (
        <Modal
          visible={!!selectedDayDetail}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedDayDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.dismissOverlay} onPress={() => setSelectedDayDetail(null)} />
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Attendance Detail</Text>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setSelectedDayDetail(null)}
                >
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetContent}>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Date</Text>
                  <Text style={styles.sheetValue}>{selectedDayDetail.date}</Text>
                </View>

                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Clock-In Time</Text>
                  <Text style={styles.sheetValue}>{selectedDayDetail.clockInTime}</Text>
                </View>

                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Approval Status</Text>
                  <Text
                    style={[
                      styles.sheetValue,
                      {
                        color:
                          selectedDayDetail.approvalStatus === 'APPROVED'
                            ? COLORS.success
                            : selectedDayDetail.approvalStatus === 'PENDING'
                              ? COLORS.warning
                              : COLORS.danger,
                        fontWeight: 'bold',
                      },
                    ]}
                  >
                    {selectedDayDetail.approvalStatus}
                  </Text>
                </View>

                {selectedDayDetail.status && (
                  <View style={styles.sheetRow}>
                    <Text style={styles.sheetLabel}>Status</Text>
                    <Text
                      style={[
                        styles.sheetValue,
                        { color: getStatusColor(selectedDayDetail.status), fontWeight: 'bold' },
                      ]}
                    >
                      {selectedDayDetail.status.replace('_', ' ')}
                    </Text>
                  </View>
                )}

                {selectedDayDetail.latitude && (
                  <View style={styles.sheetRow}>
                    <Text style={styles.sheetLabel}>Location</Text>
                    <Text style={styles.sheetValue}>
                      📍 {Number(selectedDayDetail.latitude).toFixed(5)},{' '}
                      {Number(selectedDayDetail.longitude).toFixed(5)}
                    </Text>
                  </View>
                )}

                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Remarks</Text>
                  <Text style={[styles.sheetValue, styles.remarksText]}>
                    {selectedDayDetail.remarks}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Month Selection Modal */}
      <Modal visible={showMonthModal} transparent animationType="fade">
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>Select Month</Text>
            <ScrollView style={styles.dropdownList}>
              {MONTHS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.dropdownItem, selectedMonth === m.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedMonth(m.value);
                    setShowMonthModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedMonth === m.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.dropdownClose} onPress={() => setShowMonthModal(false)}>
              <Text style={{ color: COLORS.accent, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Year Selection Modal */}
      <Modal visible={showYearModal} transparent animationType="fade">
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>Select Year</Text>
            <ScrollView style={styles.dropdownList}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.dropdownItem, selectedYear === y && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedYear(y);
                    setShowYearModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedYear === y && styles.dropdownItemTextActive,
                    ]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.dropdownClose} onPress={() => setShowYearModal(false)}>
              <Text style={{ color: COLORS.accent, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(90, 97, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(90, 97, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileDetails: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  profileContact: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    gap: 4,
  },
  selectorLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCell: {
    width: (width - 50) / 2 - 5,
    padding: 12,
    alignItems: 'center',
  },
  wideCell: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  analyticsCard: {
    padding: 16,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  chartPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  chartSubLabel: {
    fontSize: 8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  barsContainer: {
    flex: 1,
    gap: 10,
  },
  barItem: {
    gap: 4,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.accent,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: COLORS.textPrimary,
  },
  listContainer: {
    gap: 12,
  },
  timelineCard: {
    padding: 16,
    gap: 10,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  timelineDay: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  timelineBody: {
    gap: 4,
  },
  timelineClock: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  timelineRemarks: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  calendarCard: {
    padding: 12,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 6,
  },
  calendarWeekText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    width: (width - 64) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarCell: {
    width: (width - 92) / 7,
    height: (width - 92) / 7 + 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  calendarCellEmpty: {
    width: (width - 92) / 7,
    height: (width - 92) / 7 + 10,
  },
  calendarCellNum: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  calendarCellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetCloseText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  sheetContent: {
    padding: 24,
    gap: 16,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    paddingBottom: 12,
  },
  sheetLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  sheetValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  remarksText: {
    maxWidth: '60%',
    fontStyle: 'italic',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: COLORS.cardBg,
    width: width * 0.8,
    maxHeight: '60%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownList: {
    marginBottom: 16,
  },
  dropdownItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(90, 97, 246, 0.1)',
  },
  dropdownItemText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  dropdownItemTextActive: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  dropdownClose: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export default HistoryScreen;
