import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

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
}) 

{
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, theme === 'light' ? styles.labelLight : styles.labelDark]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, theme === 'light' ? styles.inputLight : styles.inputDark]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        placeholder={placeholder}
        placeholderTextColor={theme === 'light' ? '#999999' : '#666666'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },

  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 14,
    letterSpacing: 0.5,
  },

  //  (Login)
  labelDark: {
    color: '#ffffff',
  },
  inputDark: {
    borderWidth: 1.5,
    borderColor: '#c9a84c',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
    fontSize: 14,
  },

  //  (Register) 
  labelLight: {
    color: '#374151',
  },
  inputLight: {
    borderWidth: 1.5,
    borderColor: '#222428',
    borderRadius: 8,
    padding: 12,
    color: '#f5f7fb',
    backgroundColor: '#f9fafb',
    fontSize: 14,
  },

  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
});