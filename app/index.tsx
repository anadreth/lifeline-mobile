import { useToolsFunctions } from "@/src/hooks/use-tools";
import useWebRTCAudioSession from "@/src/hooks/use-webrtc";
import { tools } from "@/src/lib/tools";
import { useEffect, useState, useRef } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, TextInput as RNTextInput, Animated } from "react-native";

// Import components (make sure these are React Native components)
import { Welcome } from "../src/components/Welcome";
import { VoiceSelector } from "../src/components/VoiceSelector";
import { BroadcastButton } from "../src/components/BroadcastButton";
import { TokenUsageDisplay } from "../src/components/TokenUsageDisplay";
import { MessageControls } from "../src/components/MessageControls";
import { TextInput } from "../src/components/TextInput";
import { StatusDisplay } from "../src/components/StatusDisplay";
import { ToolsEducation } from "../src/components/ToolsEducation";

export default function Index() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingVertical: 20,
    },
    mainContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginVertical: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    buttonContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    controlsContainer: {
      width: '100%',
      marginTop: 16,
    },
    toolsContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: 16,
    }
  });

  // State for voice selection
  const [voice, setVoice] = useState("ash");

  // WebRTC Audio Session Hook
  const {
    status,
    isSessionActive,
    registerFunction,
    handleStartStopClick,
    msgs,
    conversation,
    sendTextMessage
  } = useWebRTCAudioSession(voice, tools);

  // Get all tools functions
  const toolsFunctions = useToolsFunctions();

  useEffect(() => {
    // Register all functions by iterating over the object
    Object.entries(toolsFunctions).forEach(([name, func]) => {
      const functionNames: Record<string, string> = {
        timeFunction: 'getCurrentTime',
        backgroundFunction: 'changeBackgroundColor',
        partyFunction: 'partyMode',
        launchWebsite: 'launchWebsite', 
        copyToClipboard: 'copyToClipboard',
        scrapeWebsite: 'scrapeWebsite'
      };
      
      registerFunction(functionNames[name], func);
    });
  }, [registerFunction, toolsFunctions]);

  // Animation values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerTranslateY = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const controlsHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Container animation
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();

    // Card animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      ]).start();
    }, 200);

    // Controls animation when status changes
    if (status) {
      Animated.parallel([
        Animated.timing(controlsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false
        }),
        Animated.timing(controlsHeight, {
          toValue: 1, // We'll use this value in interpolation
          duration: 300,
          useNativeDriver: false
        })
      ]).start();
    }
  }, [status]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View 
          style={[
            styles.mainContainer,
            {
              opacity: containerOpacity,
              transform: [{ translateY: containerTranslateY }]
            }
          ]}
        >
          <Welcome />
          
          <Animated.View 
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }]
              }
            ]}
          >
            <VoiceSelector value={voice} onValueChange={setVoice} />
            
            <View style={styles.buttonContainer}>
              <BroadcastButton 
                isSessionActive={isSessionActive} 
                onPress={handleStartStopClick}
              />
            </View>
            
            {msgs.length > 4 && <TokenUsageDisplay messages={msgs} />}
            
            {status && (
              <Animated.View 
                style={[
                  styles.controlsContainer,
                  {
                    opacity: controlsOpacity,
                    // Use a fixed max height instead of 'auto'
                    maxHeight: controlsHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 100] // Adjust this value based on content size
                    }),
                    overflow: 'hidden'
                  }
                ]}
              >
                <MessageControls conversation={conversation} msgs={msgs} />
                <TextInput 
                  onSubmit={sendTextMessage}
                  disabled={!isSessionActive}
                />
              </Animated.View>
            )}
          </Animated.View>
          
          {status && <StatusDisplay status={status} />}
          
          <View style={styles.toolsContainer}>
            <ToolsEducation />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
