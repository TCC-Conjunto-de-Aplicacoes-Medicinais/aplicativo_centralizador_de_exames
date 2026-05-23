import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const backgroundColor = theme.primary;
  const textColor = '#ffffff';

  const buttonStyle = [
    styles.button,
    size === 'sm' && styles.small,
    variant === 'outline' && styles.outline,
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    variant === 'outline' && { color: backgroundColor },
    size === 'sm' && styles.smallText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <ThemedText style={buttonTextStyle}>{children}</ThemedText>
    </TouchableOpacity>
  );
}

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  button: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
});