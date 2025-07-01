import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface AudioScreenProps {
  isSessionActive: boolean;
  onStartStopClick: () => void;
  onSwitchToChat: () => void;
  onClose: () => void; // Placeholder for close functionality
}

const AudioScreen: React.FC<AudioScreenProps> = ({ 
  isSessionActive, 
  onStartStopClick, 
  onSwitchToChat,
  onClose
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Image source={require('../../assets/images/splash-icon.png')} style={styles.image} />
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={onSwitchToChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color={COLORS.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isSessionActive && styles.micActive]} onPress={onStartStopClick}>
          <Ionicons name={isSessionActive ? "mic-off" : "mic"} size={30} color={isSessionActive ? COLORS.white : COLORS.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
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
  micActive: {
    backgroundColor: COLORS.primary,
  }
});

export default AudioScreen;

