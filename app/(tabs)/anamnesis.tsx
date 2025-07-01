import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { createNewExam } from '../../src/utils/exam-storage';

export default function AnamnesisGatewayScreen() {
  const router = useRouter();

  const handleCreateNew = async () => {
    try {
      const newExam = await createNewExam();
      if (newExam) {
        router.push(`/anamnesis/${newExam.id}`);
      }
    } catch (error) {
      console.error('Failed to create new exam:', error);
      // Optionally, show an error toast to the user
    }
  };

  const handleContinue = () => {
    router.push('/examinations');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AI Anamnesis</Text>
        <Text style={styles.subtitle}>Choose an option to get started</Text>

        <TouchableOpacity style={styles.button} onPress={handleCreateNew}>
          <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Create New Examination</Text>
            <Text style={styles.buttonSubtitle}>Start a fresh anamnesis session.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Ionicons name="play-circle-outline" size={32} color={COLORS.primary} />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Continue Examination</Text>
            <Text style={styles.buttonSubtitle}>Resume a previous session.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonTextContainer: {
    marginLeft: 15,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
