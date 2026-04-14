import React from 'react';
import { TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme';

interface InputProps extends TextInputProps {
  style?: ViewStyle;
}

export function Input({ style, ...props }: InputProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

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