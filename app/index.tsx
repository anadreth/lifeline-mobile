import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AudioScreen from '../src/screens/AudioScreen';
import ChatScreen from '../src/screens/ChatScreen';
import { COLORS } from '../src/constants/colors';
import useWebRTCAudioSession from '../src/hooks/use-webrtc';

type Mode = 'audio' | 'chat';

export default function App() {
  const [mode, setMode] = useState<Mode>('audio');
  const [voice, setVoice] = useState('ash'); // Default voice

  // NOTE: The `tools` array is empty as we are focusing on the UI first.
  const { 
    isSessionActive, 
    handleStartStopClick,
    conversation,
    sendTextMessage,
  } = useWebRTCAudioSession(voice, []);

  const handleClose = () => {
    // Placeholder for closing the app or session
    Alert.alert("Close Action", "This would close the session or the app.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {mode === 'audio' ? (
          <AudioScreen 
            isSessionActive={isSessionActive}
            onStartStopClick={handleStartStopClick}
            onSwitchToChat={() => setMode('chat')}
            onClose={handleClose}
          />
        ) : (
          <ChatScreen 
            conversation={conversation}
            onSendMessage={sendTextMessage}
            onSwitchToAudio={() => setMode('audio')} 
          />
        )}
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
  },
});



