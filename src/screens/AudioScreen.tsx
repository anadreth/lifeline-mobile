import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Button, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import ExamStepperScreen from './ExamStepperScreen';
import { Exam } from '../models/exam';
import { getExamById, saveExam } from '../utils/exam-storage';
import { totalSteps, sectionsWithIndex } from '../constants/exam-data';

interface AudioScreenProps {
  isSessionActive: boolean;
  onStartStopClick: () => void;
  onSwitchToChat: () => void;
  onClose: () => void;
  examId: string;
  examProgress?: Record<string, boolean>;
}

const AudioScreen = ({ isSessionActive, onStartStopClick, onSwitchToChat, onClose, examId, examProgress = {} }: AudioScreenProps) => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    const loadExam = async () => {
      if (examId) {
        const currentExam = await getExamById(examId);
        setExam(currentExam);
      } else {
        // Handle case where examId is missing, perhaps show an error or navigate back
        console.error("AudioScreen requires an examId.");
        onClose(); // Or navigate back
      }
    };
    loadExam();
  }, [examId]);
  
  // React to changes in examProgress from WebRTC hook
  useEffect(() => {
    const processExamProgress = async () => {
      if (!exam || Object.keys(examProgress).length === 0) return;
      
      // Check for newly completed steps
      for (const [part, isCompleted] of Object.entries(examProgress)) {
        // Find the step ID matching this part name
        const matchingStep = sectionsWithIndex
          .flatMap(section => section.data)
          .find(step => step.title.includes(part));
        
        if (matchingStep && isCompleted && !exam.completedSteps[matchingStep.id]) {
          // Use the handleStepToggle function with fromAI=true to mark this step as complete
          // This ensures consistent handling and notifications
          await handleStepToggle(matchingStep.id, true);
        }
      }
    };
    
    processExamProgress();
  }, [exam, examProgress]);

  // This function now requires a 'fromAI' flag to indicate if the toggle is coming from AI or manual interaction
  const handleStepToggle = async (stepId: string, fromAI: boolean = false) => {
    if (!exam) return;
    
    // Only allow setting steps to completed (not toggling) and only when triggered by AI or test
    if (!fromAI) {
      // If a user tries to manually toggle, show a message explaining they can't
      Toast.show({ 
        type: 'info', 
        text1: 'Kroky vyšetrenia nemôžu byť označené manuálne', 
        text2: 'Vyšetrenie musí byť vykonané pomocou AI asistenta',
        position: 'bottom' 
      });
      return;
    }
    
    // Always set to completed, never toggle off when coming from AI
    const newCompletedSteps = { ...exam.completedSteps, [stepId]: true };
    const completedCount = Object.values(newCompletedSteps).filter(Boolean).length;

    const updatedExam: Exam = {
      ...exam,
      completedSteps: newCompletedSteps,
      status: completedCount === totalSteps ? 'completed' : 'in-progress',
      updatedAt: new Date().toISOString(),
    };

    setExam(updatedExam);
    await saveExam(updatedExam);

    const stepInfo = sectionsWithIndex.flatMap(s => s.data).find(s => s.id === stepId);
    if (stepInfo && newCompletedSteps[stepId]) {
        Toast.show({ type: 'success', text1: stepInfo.toastText, position: 'bottom' });
    }
  };

  const handleFinishExam = () => {
    Toast.show({ type: 'success', text1: 'Vyšetrenie úspešne dokončené!' });
    onClose(); // Navigate back to dashboard
  }

  if (!exam) {
    return <ActivityIndicator size="large" style={styles.container} />;
  }

  const isExamCompleted = exam.status === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{exam ? exam.name : `Anamnéza #${examId.slice(-8)}`}</Text>
        <Button
          title="Dokončiť"
          onPress={handleFinishExam}
          disabled={!isExamCompleted}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            <Text style={styles.modalText}>Voice Selection (Mock)</Text>
            <Text style={styles.modalText}>Other Settings (Mock)</Text>
            <Button title="Close" onPress={() => setSettingsVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={exitModalVisible}
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure you want to quit this anamnesis?</Text>
            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" onPress={() => setExitModalVisible(false)} />
              <Button title="Proceed" onPress={() => {
                setExitModalVisible(false);
                onClose();
              }} />
            </View>
          </View>
        </View>
      </Modal>

      <ExamStepperScreen completedSteps={exam.completedSteps} onStepToggle={(stepId) => handleStepToggle(stepId, false)} />
      
      {/* Test button for simulating AI completion marker */}
      <View style={styles.testButtonContainer}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => {
            // Simulate receiving a message with completion marker
            const mockCompletePart = 'Vyšetrenie zraku';
            if (examProgress) {
              const simulatedProgress = { ...examProgress, [mockCompletePart]: true };
              
              // Simulate the process as if WebRTC detected a marker
              const matchingStep = sectionsWithIndex
                .flatMap(section => section.data)
                .find(step => step.title.includes(mockCompletePart));
              
              if (matchingStep && !exam.completedSteps[matchingStep.id]) {
                // Simulate step completion (with fromAI=true to allow the action)
                handleStepToggle(matchingStep.id, true);
                
                Toast.show({
                  type: 'success', 
                  text1: `TEST: Detected [[COMPLETE: ${mockCompletePart}]] marker`,
                  text2: 'Step marked as complete',
                  position: 'bottom'
                });
              }
            }
          }}
        >
          <Text style={styles.testButtonText}>TEST AI COMPLETION</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={onSwitchToChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isSessionActive && styles.sessionActiveButton]} onPress={onStartStopClick}>
          <Ionicons name="power" size={30} color={isSessionActive ? COLORS.white : COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={30} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setExitModalVisible(true)}>
          <Ionicons name="close" size={30} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  testButtonContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  testButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
  },
  testButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionActiveButton: {
    backgroundColor: COLORS.primary,
  },
});

export default AudioScreen;
