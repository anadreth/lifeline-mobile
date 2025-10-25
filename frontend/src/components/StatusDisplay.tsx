import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusDisplayProps {
  status: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Status:</Text>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 16,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    marginRight: 8,
    fontSize: 14,
  },
  statusText: {
    fontSize: 14,
    color: '#334155',
  },
});
