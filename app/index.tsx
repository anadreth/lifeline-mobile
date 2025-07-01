import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AudioScreen from '../src/screens/AudioScreen';
import ChatScreen from '../src/screens/ChatScreen';
import DashboardScreen from '../src/screens/DashboardScreen';
import { COLORS } from '../src/constants/colors';
import useWebRTCAudioSession from '../src/hooks/use-webrtc';
import Toast from 'react-native-toast-message';

type Mode = 'audio' | 'chat' | 'dashboard';

export default function App() {
  const [mode, setMode] = useState<Mode>('dashboard');
  const [currentExamId, setCurrentExamId] = useState<string | undefined>();
  const [voice, setVoice] = useState('ash'); // Default voice

  const { 
    isSessionActive, 
    handleStartStopClick,
    conversation,
    sendTextMessage,
  } = useWebRTCAudioSession(voice, []);

  const handleStartExam = (examId?: string) => {
    setCurrentExamId(examId);
    setMode('audio');
  };

  const handleSwitchToChat = () => {
    setMode('chat');
  };

  const handleReturnToDashboard = () => {
    setCurrentExamId(undefined);
    setMode('dashboard');
  };

  const handleBackToAudio = () => {
    setMode('audio');
  };

  const renderContent = () => {
    switch (mode) {
      case 'audio':
        return (
          <AudioScreen 
            isSessionActive={isSessionActive}
            onStartStopClick={handleStartStopClick}
            onSwitchToChat={handleSwitchToChat}
            onClose={handleReturnToDashboard}
            examId={currentExamId}
          />
        );
      case 'chat':
        return (
          <ChatScreen 
            messages={conversation}
            onSendMessage={sendTextMessage}
            onBack={handleBackToAudio}
          />
        );
      case 'dashboard':
      default:
        return <DashboardScreen onStartExam={handleStartExam} />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>{renderContent()}</View>
        <Toast />
      </SafeAreaView>
    </GestureHandlerRootView>
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



