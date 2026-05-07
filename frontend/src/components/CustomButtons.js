import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CustomButton({ title, onPress, type = 'primary' }) {
  return (
    <TouchableOpacity
      style={[styles.button, type === 'secondary' && styles.secondary]}
      onPress={onPress}
    >
      <Text style={[styles.text, type === 'secondary' && styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#08ff14',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  secondary: {
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryText: {
    color: '#0066cc',
  },
});
