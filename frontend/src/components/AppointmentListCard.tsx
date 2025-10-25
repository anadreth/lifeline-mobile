import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';

export interface AppointmentListCardProps {
  id: string;
  doctorName: string;
  specialty: string;
  avatarUrl: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Completed' | 'Canceled';
}

const statusStyles = {
  Confirmed: { color: COLORS.success, icon: 'checkmark-circle' },
  Completed: { color: COLORS.textSecondary, icon: 'checkmark-done-circle' },
  Canceled: { color: COLORS.danger, icon: 'close-circle' },
};

const AppointmentListCard = (props: AppointmentListCardProps) => {
  const { doctorName, specialty, avatarUrl, date, time, status } = props;
  const { color, icon } = statusStyles[status];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <Text style={styles.specialty}>{specialty}</Text>
        </View>
        <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.separator} />
      <View style={styles.footer}>
        <View style={styles.dateTimeContainer}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>{date}</Text>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} style={{ marginLeft: 16 }} />
          <Text style={styles.footerText}>{time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${color}1A` }]}>
          <Ionicons name={icon as any} size={14} color={color} />
          <Text style={[styles.statusText, { color }]}>{status}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0, // Remove default padding to have full control
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: COLORS.lightGrey,
  },
  headerText: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  specialty: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default AppointmentListCard;
