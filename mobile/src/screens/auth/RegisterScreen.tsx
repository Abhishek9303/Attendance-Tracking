import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { COLORS, GLASS_STYLES } from '../../components/Theme';

export const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/register', { name, email, phone, password, role });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.logo}>✦</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the company workflow platform</Text>
        </View>

        <View style={[GLASS_STYLES.card, styles.formCard]}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[GLASS_STYLES.input, styles.inputSpace]}
            placeholder="John Doe"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[GLASS_STYLES.input, styles.inputSpace]}
            placeholder="name@company.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[GLASS_STYLES.input, styles.inputSpace]}
            placeholder="+1 555 123 4567"
            placeholderTextColor="#666"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[GLASS_STYLES.input, styles.inputSpace]}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Register As</Text>
          <View style={styles.rolePicker}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'USER' && styles.roleBtnActive]}
              onPress={() => setRole('USER')}
            >
              <Text style={[styles.roleBtnText, role === 'USER' && styles.roleBtnTextActive]}>Employee</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={[styles.roleBtn, role === 'ADMIN' && styles.roleBtnActive]}
              onPress={() => setRole('ADMIN')}
            >
              <Text style={[styles.roleBtnText, role === 'ADMIN' && styles.roleBtnTextActive]}>Administrator</Text>
            </TouchableOpacity> */}
          </View>

          <TouchableOpacity style={GLASS_STYLES.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register Now</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 50,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 44,
    color: COLORS.accent,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    paddingVertical: 24,
  },
  label: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  inputSpace: {
    marginBottom: 16,
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  roleBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(90, 97, 246, 0.1)',
  },
  roleBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: COLORS.textPrimary,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
  },
  loginLink: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
