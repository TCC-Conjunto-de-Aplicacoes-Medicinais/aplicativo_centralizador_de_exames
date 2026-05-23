import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { ThemedText } from '../themed-text';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={[styles.badge, variant === 'secondary' && styles.secondary, style]}>
      <ThemedText style={[styles.text, variant === 'secondary' && styles.secondaryText, textStyle]}>
        {children}
      </ThemedText>
    </View>
  );
}

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  badge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  secondary: {
    backgroundColor: theme.border,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryText: {
    color: theme.textSecondary,
  },
});