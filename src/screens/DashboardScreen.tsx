import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { COLORS } from '../constants/colors';

interface DashboardScreenProps {
  onNavigateToAudio: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToAudio }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Graphs, results, and health monitoring will be displayed here.</Text>
      <Button title="Go to Audio Session" onPress={onNavigateToAudio} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
});

export default DashboardScreen;
