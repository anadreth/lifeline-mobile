import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { COLORS } from '../../src/constants/colors';
import AppointmentListCard, { AppointmentListCardProps } from '../../src/components/AppointmentListCard';

const upcomingAppointments: AppointmentListCardProps[] = [
  {
    id: '1',
    doctorName: 'Dr. Evelyn Reed',
    specialty: 'Cardiologist',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    date: 'Dec 20, 2024',
    time: '10:30 AM',
    status: 'Confirmed',
  },
  {
    id: '2',
    doctorName: 'Dr. Marcus Chen',
    specialty: 'Dermatologist',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
    date: 'Dec 28, 2024',
    time: '2:00 PM',
    status: 'Confirmed',
  },
];

const pastAppointments: AppointmentListCardProps[] = [
  {
    id: '3',
    doctorName: 'Dr. Alan Grant',
    specialty: 'Pediatrician',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
    date: 'Nov 15, 2024',
    time: '11:00 AM',
    status: 'Completed',
  },
];

type Segment = 'Upcoming' | 'Past';

export default function AppointmentsScreen() {
  const [activeSegment, setActiveSegment] = useState<Segment>('Upcoming');

  const data = activeSegment === 'Upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Appointments</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity 
            style={[styles.segment, activeSegment === 'Upcoming' && styles.activeSegment]}
            onPress={() => setActiveSegment('Upcoming')}
          >
            <Text style={[styles.segmentText, activeSegment === 'Upcoming' && styles.activeSegmentText]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segment, activeSegment === 'Past' && styles.activeSegment]}
            onPress={() => setActiveSegment('Past')}
          >
            <Text style={[styles.segmentText, activeSegment === 'Past' && styles.activeSegmentText]}>Past</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          renderItem={({ item }) => <AppointmentListCard {...item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingTop: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    marginTop: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeSegment: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeSegmentText: {
    color: COLORS.white,
  },
});

