import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedView } from '../themed-view';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <ThemedView style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
}

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});