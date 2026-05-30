import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const MarkAttendanceScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  // Simulation parameters to allow easy developer validation!
  const [simulateOutside, setSimulateOutside] = useState(false);
  const [selfieOption, setSelfieOption] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');

  const handleMarkAttendance = async () => {
    setLoading(true);

    // Simulated coordinates
    const latitude = simulateOutside ? 24.1251 : 23.2599;
    const longitude = simulateOutside ? 78.3129 : 77.4126;

    try {
      const res = await apiClient.post('/api/attendance/mark', {
        latitude,
        longitude,
        selfieUrl: selfieOption,
      });

      Alert.alert('Success 🎉', res.data.message, [
        { text: 'Back to Dashboard', onPress: () => navigation.replace('UserDashboard') }
      ]);
    } catch (err: any) {
      Alert.alert(
        'Submission Failed ❌',
        err.response?.data?.message || 'Failed to register coordinate signature.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mark Attendance</Text>
      </View>

      {/* Selfie Preview */}
      <View style={[GLASS_STYLES.card, styles.centerCard]}>
        <Text style={styles.cardHeader}>Camera (Selfie) Verification</Text>
        <Image source={{ uri: selfieOption }} style={styles.selfieImage} />
        <Text style={styles.cameraNote}>✓ Camera simulation ready (1080p, Auto-Focus)</Text>
      </View>

      {/* Simulators Control Card */}
      <View style={[GLASS_STYLES.card, styles.cardSpace]}>
        <Text style={styles.cardHeader}>Developer Simulation Controls</Text>
        <Text style={styles.cardDesc}>
          Simulate geographic coordinates relative to the office boundary to validate API constraints.
        </Text>

        <Text style={styles.toggleLabel}>Location Coordinates:</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.simBtn, !simulateOutside && styles.simBtnActive]}
            onPress={() => setSimulateOutside(false)}
          >
            <Text style={[styles.simBtnText, !simulateOutside && styles.simBtnTextActive]}>
              Inside Office (Allowed)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.simBtn, simulateOutside && styles.simBtnActive]}
            onPress={() => setSimulateOutside(true)}
          >
            <Text style={[styles.simBtnText, simulateOutside && styles.simBtnTextActive]}>
              Outside Office (Blocked)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.coordDetails}>
          <Text style={styles.coordText}>
            📍 Latitude: {simulateOutside ? '24.1251' : '23.2599'}
          </Text>
          <Text style={styles.coordText}>
            📍 Longitude: {simulateOutside ? '78.3129' : '77.4126'}
          </Text>
          <Text style={styles.distanceText}>
            Status: {simulateOutside ? 'Distance: ~130 km (Out of Range)' : 'Distance: 0m (In Office Radius)'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[GLASS_STYLES.button, styles.actionBtn]}
        onPress={handleMarkAttendance}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionBtnText}>Confirm and Submit Logs</Text>
        )}
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  centerCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 16,
  },
  selfieImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: COLORS.accent,
    marginBottom: 16,
  },
  cameraNote: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  cardSpace: {
    padding: 16,
    marginBottom: 24,
  },
  toggleLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  simBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  simBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(90, 97, 246, 0.1)',
  },
  simBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  simBtnTextActive: {
    color: COLORS.textPrimary,
  },
  coordDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  coordText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  distanceText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  actionBtn: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MarkAttendanceScreen;
