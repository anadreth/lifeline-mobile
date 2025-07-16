import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { COLORS } from '../../../src/constants/colors';
import { examStepContent } from '../../../src/constants/exam-step-content';
import StepDetailScreen from '../../../src/screens/StepDetailScreen';
import { sectionsWithIndex } from '../../../src/constants/exam-data';
import { ActivityIndicator, View } from 'react-native';
import useWebRTCAudioSession from '../../../src/hooks/use-webrtc';

export default function ExamStepDetailScreen() {
  const router = useRouter();
  const { id, examId } = useLocalSearchParams<{ id: string; examId: string }>();
  const [loading, setLoading] = useState(true);
  const [stepInfo, setStepInfo] = useState<{
    title: string;
    description: string;
    id: string;
  } | null>(null);
  
  // Initialize WebRTC session with the same examId as the parent screen
  const { 
    isSessionActive,
    startSession,
    stopSession,
    handleStartStopClick: toggleSession,
    examProgress
  } = useWebRTCAudioSession(examId as string, 'sk-SK', []);

  useEffect(() => {
    if (id) {
      // Find step info from all sections
      const foundStep = sectionsWithIndex
        .flatMap(section => section.data)
        .find(step => step.id === id);

      if (foundStep) {
        setStepInfo({
          title: foundStep.title,
          description: foundStep.description,
          id: foundStep.id
        });
      }
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };
  
  // Use the hook's built-in toggle function
  const handleStartStopClick = toggleSession;
  
  // Since switchToChat is no longer available, we just navigate back
  const handleSwitchToChat = () => {
    router.back(); // Navigate back to the main screen
    // The parent screen likely has chat mode toggle
  };
  
  const handleClose = () => {
    if (isSessionActive) {
      stopSession();
    }
    router.push('/'); // Navigate to home screen
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!stepInfo) {
    // Handle case where step ID is invalid
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Stack.Screen options={{ title: 'Krok nenájdený' }} />
        <StepDetailScreen 
          stepId={id || ''} 
          title="Krok nenájdený"
          description="Požadovaný krok vyšetrenia sa nenašiel."
          content={<></>}
          onBack={handleBack}
          isSessionActive={isSessionActive}
          onStartStopClick={handleStartStopClick}
          onSwitchToChat={handleSwitchToChat}
          onClose={handleClose}
          examId={examId as string}
        />
      </View>
    );
  }

  // Get content for this step
  const content = examStepContent[stepInfo.id] || <></>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StepDetailScreen
        stepId={stepInfo.id}
        title={stepInfo.title}
        description={stepInfo.description}
        content={content}
        onBack={handleBack}
        isSessionActive={isSessionActive}
        onStartStopClick={handleStartStopClick}
        onSwitchToChat={handleSwitchToChat}
        onClose={handleClose}
        examId={examId as string}
      />
    </>
  );
}
