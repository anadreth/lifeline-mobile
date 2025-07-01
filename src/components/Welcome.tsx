import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Welcome: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenAI Realtime API (WebRTC)</Text>
      <Text style={styles.subtitle}>Demo by clicking the button below and try available tools</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
