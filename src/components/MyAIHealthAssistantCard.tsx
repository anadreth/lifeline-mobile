import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';

interface MyAIHealthAssistantCardProps {
  onPress: () => void;
}

const MyAIHealthAssistantCard = ({ onPress }: MyAIHealthAssistantCardProps) => {
  return (
    <Card style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles-outline" size={24} color={COLORS.white} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>My AI Health Assistant</Text>
        <Text style={styles.subtitle}>Ready to help with health questions and triage</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Chat Now</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 99,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default MyAIHealthAssistantCard;
