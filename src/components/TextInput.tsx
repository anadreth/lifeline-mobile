import React, { useState } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface TextInputProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({ onSubmit, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <RNTextInput
        style={styles.input}
        placeholder="Type a message..."
        value={message}
        onChangeText={setMessage}
        multiline
        editable={!disabled}
        placeholderTextColor="#94a3b8"
      />
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={disabled || !message.trim()}
      >
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    maxHeight: 100,
  },
  button: {
    marginLeft: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
