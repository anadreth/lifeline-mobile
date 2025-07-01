import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AudioScreen from '../../src/screens/AudioScreen';
import ChatScreen from '../../src/screens/ChatScreen';
import { getExamById } from '../../src/utils/exam-storage';
import { Exam } from '../../src/models/exam';
import useWebRTCAudioSession from '../../src/hooks/use-webrtc';
import { COLORS } from '../../src/constants/colors';

type Mode = 'audio' | 'chat';

export default function AnamnesisScreen() {
  const router = useRouter();
  const { id: examId } = useLocalSearchParams<{ id: string }>();
  const [mode, setMode] = useState<Mode>('audio');
  const [voice] = useState('ash');
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (examId) {
      getExamById(examId).then(setExam);
    }
  }, [examId]);

  const { 
    isSessionActive, 
    handleStartStopClick,
    conversation,
    sendTextMessage,
  } = useWebRTCAudioSession(examId, voice, []);

  const handleSwitchToChat = () => {
    setMode('chat');
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleBackToAudio = () => {
    setMode('audio');
  };

  if (!examId) {
    // Render a loading state or null while waiting for the ID
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {mode === 'audio' ? (
        <AudioScreen
          examId={examId}
          isSessionActive={isSessionActive}
          onStartStopClick={handleStartStopClick}
          onSwitchToChat={handleSwitchToChat}
          onClose={handleClose}
        />
      ) : (
        <ChatScreen
          exam={exam}
          messages={conversation}
          onSendMessage={sendTextMessage}
          onBack={handleBackToAudio}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
