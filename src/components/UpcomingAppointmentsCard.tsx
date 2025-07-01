import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';

const AppointmentItem = ({ doctor, specialty, time, icon }: any) => (
  <View style={styles.itemContainer}>
    <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.itemDetails}>
      <Text style={styles.doctorName}>{doctor}</Text>
      <Text style={styles.specialty}>{specialty}</Text>
    </View>
    <Text style={styles.timeText}>{time}</Text>
  </View>
);

const UpcomingAppointmentsCard = () => {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Upcoming Appointments</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <AppointmentItem 
        doctor="Dr. Evelyn Reed"
        specialty="Cardiologist"
        time="10:30 AM"
        icon="medkit-outline"
      />
      <AppointmentItem 
        doctor="Dr. Marcus Chen"
        specialty="Dermatologist"
        time="2:00 PM"
        icon="body-outline"
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  specialty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
});

export default UpcomingAppointmentsCard;
