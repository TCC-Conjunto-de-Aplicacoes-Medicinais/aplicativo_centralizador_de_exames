import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  return (
    <View style={[styles.badge, variant === 'secondary' && styles.secondary, style]}>
      <ThemedText style={[styles.text, variant === 'secondary' && styles.secondaryText, textStyle]}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#0f766e', // teal-600
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  secondary: {
    backgroundColor: '#f1f5f9', // slate-100
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#475569', // slate-600
  },
});