import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#0a0a0c',
  cardBg: '#121217',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#ffffff',
  textSecondary: '#8a8a93',
  accent: '#5a61f6', // Premium indigo purple
  accentHover: '#4950e3',
  success: '#10b981', // Emerald green
  successBg: 'rgba(16, 185, 129, 0.1)',
  danger: '#ef4444', // Sleek red
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  warning: '#f59e0b', // Amber yellow
  warningBg: 'rgba(245, 158, 11, 0.1)',
  inputBg: '#16161f',
  inputBorder: 'rgba(255, 255, 255, 0.05)',
  loader: '#ffffff',
};

export const FONTS = {
  bold: 'System',
  medium: 'System',
  regular: 'System',
};

export const GLASS_STYLES = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    color: COLORS.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
});
