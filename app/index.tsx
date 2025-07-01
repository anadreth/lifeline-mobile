import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import AudioScreen from '../src/screens/AudioScreen';
import ChatScreen from '../src/screens/ChatScreen';
import DashboardScreen from '../src/screens/DashboardScreen';
import { COLORS } from '../src/constants/colors';
import useWebRTCAudioSession from '../src/hooks/use-webrtc';

type Mode = 'audio' | 'chat' | 'dashboard';

export default function App() {
  const [mode, setMode] = useState<Mode>('dashboard');
  const [voice, setVoice] = useState('ash'); // Default voice

  const { 
    isSessionActive, 
    handleStartStopClick,
    conversation,
    sendTextMessage,
  } = useWebRTCAudioSession(voice, []);

  const renderContent = () => {
    switch (mode) {
      case 'dashboard':
        return <DashboardScreen onNavigateToAudio={() => setMode('audio')} />;
      case 'audio':
        return (
          <AudioScreen 
            isSessionActive={isSessionActive}
            onStartStopClick={handleStartStopClick}
            onSwitchToChat={() => setMode('chat')}
            onClose={() => setMode('dashboard')}
          />
        );
      case 'chat':
        return (
          <ChatScreen 
            conversation={conversation}
            onSendMessage={sendTextMessage}
            onSwitchToAudio={() => setMode('audio')} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{renderContent()}</View>
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



