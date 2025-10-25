import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Button,
} from "react-native";
import DailyHealthNudgesCard from "../../src/components/DailyHealthNudgesCard";
import HealthGoalsCard from "../../src/components/HealthGoalsCard";
import LiveVitalsCard from "../../src/components/LiveVitalsCard";
import MyAIHealthAssistantCard from "../../src/components/MyAIHealthAssistantCard";
import UpcomingAppointmentsCard from "../../src/components/UpcomingAppointmentsCard";
import { COLORS } from "../../src/constants/colors";

export default function HomeScreen() {
  const router = useRouter();

  const handleChatNow = () => {
    router.push({ pathname: "/anamnesis" } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Button
          onPress={() => router.push("/anamnesis/1")}
          title="to anamnesis 1"
        />
        <View style={styles.header}>
          <Text style={styles.title}>Good morning, Alex! 👋</Text>
          <Text style={styles.subtitle}>
            Here's your health overview for today
          </Text>
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
    fontWeight: "bold",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
