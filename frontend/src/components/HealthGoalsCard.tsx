import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';

const GoalItem = ({ icon, name, progress, target, color }: any) => (
  <View style={styles.goalItem}>
    <Ionicons name={icon} size={24} color={color} style={styles.goalIcon} />
    <View style={styles.goalDetails}>
      <Text style={styles.goalName}>{name}</Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
    <Text style={styles.goalProgressText}>{`${Math.round(progress)}%`}</Text>
  </View>
);

const HealthGoalsCard = () => {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Health Goals</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>Manage</Text>
        </TouchableOpacity>
      </View>
      <GoalItem 
        icon="walk-outline"
        name="Daily Steps"
        progress={75}
        color="#3B82F6"
      />
      <GoalItem 
        icon="moon-outline"
        name="Sleep Quality"
        progress={90}
        color="#8B5CF6"
      />
      <GoalItem 
        icon="water-outline"
        name="Hydration"
        progress={50}
        color="#0EA5E9"
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalIcon: {
    marginRight: 16,
  },
  goalDetails: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 16,
    width: 40, // for alignment
    textAlign: 'right',
  },
});

export default HealthGoalsCard;
