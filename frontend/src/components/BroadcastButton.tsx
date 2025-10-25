import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BroadcastButtonProps {
  isSessionActive: boolean;
  onPress: () => void;
}

export const BroadcastButton: React.FC<BroadcastButtonProps> = ({ isSessionActive, onPress }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        isSessionActive ? styles.stopButton : styles.startButton
      ]} 
      onPress={onPress}
    >
      <Text style={styles.buttonText}>
        {isSessionActive ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#0f172a',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
