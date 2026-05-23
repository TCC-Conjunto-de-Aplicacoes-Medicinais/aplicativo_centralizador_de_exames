import React from 'react';
import { TextInput, StyleSheet, TextStyle, TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface InputProps extends TextInputProps {
  style?: TextStyle;
}

export function Input({ style, ...props }: InputProps) {
  const { theme } = useTheme();
  const backgroundColor = theme.card;
  const textColor = theme.text;
  const borderColor = theme.border;

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor,
          color: textColor,
          borderColor,
        },
        style,
      ]}
      placeholderTextColor="#94a3b8" // slate-400
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});