import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';

const NudgeItem = ({ icon, text, time, color, backgroundColor }: any) => (
  <View style={[styles.nudgeContainer, { backgroundColor }]}>
    <Ionicons name={icon} size={24} color={color} style={styles.nudgeIcon} />
    <View style={styles.nudgeTextContainer}>
      <Text style={styles.nudgeText}>{text}</Text>
      <Text style={styles.nudgeTime}>{time}</Text>
    </View>
  </View>
);

const DailyHealthNudgesCard = () => {
  return (
    <Card>
      <Text style={styles.cardTitle}>Daily Health Nudges</Text>
      <NudgeItem 
        icon="alert-circle-outline"
        text="Your BP has been elevated for 3 days. Let's check on that."
        time="2 hours ago"
        color={COLORS.danger}
        backgroundColor={'#FEE2E2'}
      />
      <NudgeItem 
        icon="checkmark-circle-outline"
        text="Great job! You've hit your step goal 5 days in a row."
        time="1 day ago"
        color={COLORS.success}
        backgroundColor={'#D1FAE5'}
      />
      <NudgeItem 
        icon="time-outline"
        text="Consider going to bed earlier - your sleep quality could improve."
        time="3 days ago"
        color={COLORS.warning}
        backgroundColor={'#FEF3C7'}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  nudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  nudgeIcon: {
    marginRight: 12,
  },
  nudgeTextContainer: {
    flex: 1,
  },
  nudgeText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  nudgeTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default DailyHealthNudgesCard;
