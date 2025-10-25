import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Button, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface ExamControlsProps {
  isSessionActive: boolean;
  onStartStopClick: () => void;
  onSwitchToChat: () => void;
  onSettingsClick: () => void;
  onExitClick: () => void;
}

const ExamControls = ({
  isSessionActive,
  onStartStopClick,
  onSwitchToChat,
  onSettingsClick,
  onExitClick
}: ExamControlsProps) => {
  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity style={styles.controlButton} onPress={onSwitchToChat}>
        <Ionicons name="chatbubble-ellipses-outline" size={30} color={COLORS.textSecondary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.controlButton, isSessionActive && styles.sessionActiveButton]} 
        onPress={onStartStopClick}
      >
        <Ionicons 
          name="power" 
          size={30} 
          color={isSessionActive ? COLORS.white : COLORS.textSecondary} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.controlButton} onPress={onSettingsClick}>
        <Ionicons name="ellipsis-horizontal" size={30} color={COLORS.textSecondary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.controlButton} onPress={onExitClick}>
        <Ionicons name="close" size={30} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default ExamControls;
