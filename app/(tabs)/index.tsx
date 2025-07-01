import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import LiveVitalsCard from '../../src/components/LiveVitalsCard';
import MyAIHealthAssistantCard from '../../src/components/MyAIHealthAssistantCard';
import DailyHealthNudgesCard from '../../src/components/DailyHealthNudgesCard';
import UpcomingAppointmentsCard from '../../src/components/UpcomingAppointmentsCard';
import HealthGoalsCard from '../../src/components/HealthGoalsCard';

export default function HomeScreen() {
  const router = useRouter();

  const handleChatNow = () => {
    router.push({ pathname: '/anamnesis' } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Good morning, Alex! 👋</Text>
          <Text style={styles.subtitle}>Here's your health overview for today</Text>
        </View>
        <LiveVitalsCard />
        <MyAIHealthAssistantCard onPress={handleChatNow} />
        <DailyHealthNudgesCard />
        <UpcomingAppointmentsCard />
        <HealthGoalsCard />
        {/* Other cards will go here */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

