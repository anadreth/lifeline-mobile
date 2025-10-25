import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, Modal, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import ExamControls from '../components/ExamControls';

interface StepDetailScreenProps {
  stepId: string;
  title: string;
  description: string;
  content: React.ReactNode;
  onBack: () => void;
  isSessionActive?: boolean;
  onStartStopClick?: () => void;
  onSwitchToChat?: () => void;
  onClose?: () => void;
  examId?: string;
}

const StepDetailScreen = ({ 
  stepId, 
  title, 
  description, 
  content, 
  onBack,
  isSessionActive = false,
  onStartStopClick = () => {},
  onSwitchToChat = () => {},
  onClose = () => {},
  examId
}: StepDetailScreenProps) => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.descriptionText}>{description}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.contentWrapper}>
          {content}
        </View>

        {/* Add extra padding at the bottom to ensure content is visible above controls */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Settings Modal */}
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

      {/* Exit Confirmation Modal */}
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
      
      {/* Add the shared exam controls */}
      <ExamControls
        isSessionActive={isSessionActive}
        onStartStopClick={onStartStopClick}
        onSwitchToChat={onSwitchToChat}
        onSettingsClick={() => setSettingsVisible(true)}
        onExitClick={() => setExitModalVisible(true)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40, // same width as back button for balanced header
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  contentWrapper: {
    marginBottom: 20,
  },
  bottomPadding: {
    height: 120, // Space to ensure content is visible above controls
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});

export default StepDetailScreen;
