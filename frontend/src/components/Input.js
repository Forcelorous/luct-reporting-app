import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Input({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  placeholder = '',
  theme = 'dark',
  multiline = false,
  numberOfLines = 1,
  editable = true,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, theme === 'light' ? styles.labelLight : styles.labelDark]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputWrapper,
        theme === 'light' ? styles.inputWrapperLight : styles.inputWrapperDark,
        !editable && styles.inputDisabled,
      ]}>
        <TextInput
          style={[
            styles.input,
            theme === 'light' ? styles.inputLight : styles.inputDark,
            multiline && styles.multiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          placeholder={placeholder}
          placeholderTextColor={theme === 'light' ? '#9ca3af' : '#666666'}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme === 'light' ? '#6b7280' : '#888888'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Label colors
  labelDark: { color: '#ffffff' },
  labelLight: { color: '#374151' },

  // Input wrapper
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
  },
  inputWrapperDark: {
    borderColor: '#c9a84c',
    backgroundColor: '#1a1a1a',
  },
  inputWrapperLight: {
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  inputDisabled: {
    opacity: 0.6,
  },

  // Text input
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
  },
  inputDark: {
    color: '#ffffff',
  },
  inputLight: {
    color: '#111827',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Eye icon 
  eyeIcon: {
    paddingRight: 12,
    paddingLeft: 4,
  },
});