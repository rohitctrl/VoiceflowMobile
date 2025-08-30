import { DefaultTheme } from 'react-native-paper';

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1', // Indigo primary color
    primaryContainer: '#E0E7FF',
    secondary: '#10B981', // Emerald secondary color
    secondaryContainer: '#D1FAE5',
    tertiary: '#F59E0B', // Amber tertiary color
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
    background: '#FAFAFA',
    error: '#EF4444',
    errorContainer: '#FEE2E2',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1F2937',
    onBackground: '#1F2937',
    outline: '#D1D5DB',
  },
  roundness: 12, // More rounded corners for modern look
  fonts: {
    ...DefaultTheme.fonts,
    default: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400' as const,
    },
    headlineLarge: {
      fontFamily: 'Inter-Bold',
      fontWeight: '700' as const,
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600' as const,
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600' as const,
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
    },
    titleLarge: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500' as const,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500' as const,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500' as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    bodyLarge: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400' as const,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400' as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400' as const,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    labelLarge: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500' as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500' as const,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500' as const,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
};

export default customTheme;