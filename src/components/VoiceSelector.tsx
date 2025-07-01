import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface VoiceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ value, onValueChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select a voice</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          <Picker.Item label="Ash - Gentle & Professional" value="ash" />
          <Picker.Item label="Nova - Warm & Natural" value="nova" />
          <Picker.Item label="Echo - Clear & Precise" value="echo" />
          <Picker.Item label="Sky - Energetic & Friendly" value="sky" />
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});
