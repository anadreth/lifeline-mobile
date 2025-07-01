import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TextInput, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { createNewExam } from '../../src/utils/exam-storage';

export default function AnamnesisGatewayScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [examName, setExamName] = useState('');

  const handleCreateNew = async () => {
    if (!examName.trim()) {
      // Optionally, show an alert if the name is empty
      return;
    }
    try {
      const newExam = await createNewExam(examName);
      if (newExam) {
        setModalVisible(false);
        setExamName('');
        router.push(`/anamnesis/${newExam.id}`);
      }
    } catch (error) {
      console.error('Failed to create new exam:', error);
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

        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)} >
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Examination</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning Check-in"
              value={examName}
              onChangeText={setExamName}
            />
            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Create" onPress={handleCreateNew} />
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
