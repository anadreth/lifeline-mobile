import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TokenUsageDisplayProps {
  messages: any[]; // Replace with proper message type
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({ messages }) => {
  // Calculate token usage (simplified example)
  const totalTokens = messages.length * 50; // This is a placeholder calculation
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Token Usage: {totalTokens}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  text: {
    fontSize: 14,
    color: '#64748b',
  },
});
