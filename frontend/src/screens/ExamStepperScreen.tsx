import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Animated,
  SectionListRenderItemInfo,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { ExamSection, sectionsWithIndex, Step } from '../constants/exam-data';
import { ExamStepState } from '../models/exam';

interface ExamStepperScreenProps {
  completedSteps: ExamStepState;
  onStepToggle: (stepId: string) => void;
}

const ExamStepperScreen = ({ completedSteps, onStepToggle }: ExamStepperScreenProps) => {
  const animatedValues = useRef<Record<string, Animated.Value>>({}).current;

  sectionsWithIndex.forEach(section => {
    section.data.forEach(step => {
      if (!animatedValues[step.id]) {
        animatedValues[step.id] = new Animated.Value(completedSteps[step.id] ? 1 : 0);
      }
    });
  });

  const handlePressStep = (step: Step) => {
    const isCurrentlyCompleted = !!completedSteps[step.id];
    Animated.timing(animatedValues[step.id], {
      toValue: isCurrentlyCompleted ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    onStepToggle(step.id);
  };

  const renderStep = ({ item }: SectionListRenderItemInfo<Step, ExamSection>) => {
    const isCompleted = !!completedSteps[item.id];
    const animationStyle = {
      transform: [
        {
          scale: animatedValues[item.id]?.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1],
          }) ?? 1,
        },
      ],
      opacity: animatedValues[item.id]?.interpolate({
        inputRange: [0, 1],
        outputRange: [0.7, 1],
      }) ?? 1,
    };

    return (
      <Animated.View style={animationStyle}>
        <TouchableOpacity
          style={[styles.stepContainer, isCompleted && styles.stepCompleted]}
          onPress={() => handlePressStep(item)}
        >
          <View style={styles.stepIconContainer}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={isCompleted ? COLORS.primary : COLORS.icon}
            />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepDescription}>{item.description}</Text>
          </View>
          <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
            {isCompleted && <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <SectionList<Step, ExamSection>
        sections={sectionsWithIndex}
        keyExtractor={item => item.id}
        renderItem={renderStep}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for controls
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    marginTop: 15,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepCompleted: {
    backgroundColor: '#e8f5e9',
    borderColor: COLORS.primary,
  },
  stepIconContainer: {
    marginRight: 15,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});

export default ExamStepperScreen;
