import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Modal, Text, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface AudioScreenProps {
  isSessionActive: boolean;
  onStartStopClick: () => void;
  onSwitchToChat: () => void;
  onClose: () => void;
}

const AudioScreen: React.FC<AudioScreenProps> = ({ 
  isSessionActive, 
  onStartStopClick, 
  onSwitchToChat,
  onClose
}) => {
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSettingsVisible}
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

      <View style={styles.circle}>
        <Image source={require('../../assets/images/splash-icon.png')} style={styles.image} />
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={onSwitchToChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color={COLORS.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isSessionActive && styles.sessionActiveButton]} onPress={onStartStopClick}>
          <Ionicons name="power" size={30} color={isSessionActive ? COLORS.white : COLORS.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={30} color={COLORS.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Ionicons name="close" size={30} color={COLORS.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingBottom: 100, // Space for controls
  },
  circle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 60,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  controlButton: {
    backgroundColor: COLORS.border,
    padding: 15,
    borderRadius: 30,
  },
  sessionActiveButton: {
    backgroundColor: COLORS.primary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default AudioScreen;

