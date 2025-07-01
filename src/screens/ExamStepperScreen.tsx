import React, { useState, useRef, useEffect } from 'react';
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
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';

// Data Structure
interface Step {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  toastText: string;
}

interface ExamSection {
  title: string;
  data: Step[];
  index: number;
}

interface ExamStepperScreenProps {
  onCompletionChange: (isCompleted: boolean) => void;
}

const EXAM_DATA: Omit<ExamSection, 'index'>[] = [
  {
    title: 'Hlava a krk',
    data: [
      { id: '1', icon: 'eye-outline', title: 'Vyšetrenie zraku', description: 'Kontrola zrakovej ostrosti a zorného poľa.', toastText: 'Vyšetrenie zraku dokončené' },
      { id: '2', icon: 'ear-hearing', title: 'Vyšetrenie sluchu', description: 'Základné audiometrické testy.', toastText: 'Vyšetrenie sluchu dokončené' },
    ],
  },
  {
    title: 'Hrudník',
    data: [
      { id: '3', icon: 'stethoscope', title: 'Auskultácia srdca', description: 'Počúvanie srdcových oziev.', toastText: 'Auskultácia srdca dokončená' },
      { id: '4', icon: 'lungs', title: 'Auskultácia pľúc', description: 'Počúvanie dýchacích fenoménov.', toastText: 'Auskultácia pľúc dokončená' },
    ],
  },
  {
    title: 'Brucho',
    data: [
      { id: '5', icon: 'hand-heart-outline', title: 'Palpácia brucha', description: 'Vyšetrenie pohmatom na zistenie citlivosti.', toastText: 'Palpácia brucha dokončená' },
    ],
  },
  {
    title: 'Končatiny',
    data: [
        { id: '6', icon: 'walk', title: 'Vyšetrenie chôdze', description: 'Analýza stereotypu chôdze.', toastText: 'Vyšetrenie chôdze dokončené' },
    ],
  },
  {
    title: 'Koža',
    data: [
        { id: '7', icon: 'camera-outline', title: 'Inšpekcia kože', description: 'Vizuálna kontrola znamienok a lézií.', toastText: 'Inšpekcia kože dokončená' },
    ],
  },
  {
    title: 'Nervový systém',
    data: [
        { id: '8', icon: 'hand-pointing-up', title: 'Test reflexov', description: 'Skúška základných reflexov.', toastText: 'Test reflexov dokončený' },
    ],
  },
  {
    title: 'Zvyšné funkcie',
    data: [
        { id: '9', icon: 'head-question-outline', title: 'Anamnéza', description: 'Doplňujúce otázky k zdravotnému stavu.', toastText: 'Anamnéza dokončená' },
    ],
  },
];

const sectionsWithIndex: ExamSection[] = EXAM_DATA.map((section, index) => ({ ...section, index }));
const totalSteps = sectionsWithIndex.reduce((acc, section) => acc + section.data.length, 0);

const ExamStepperScreen = ({ onCompletionChange }: ExamStepperScreenProps) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const animatedValues = useRef<Record<string, Animated.Value>>({}).current;
  const sectionListRef = useRef<SectionList<Step, ExamSection>>(null);

  const allStepsCompleted = Object.keys(completedSteps).filter(key => completedSteps[key]).length === totalSteps;

  useEffect(() => {
    onCompletionChange(allStepsCompleted);
  }, [allStepsCompleted, onCompletionChange]);

  sectionsWithIndex.forEach(section => {
    section.data.forEach(step => {
      if (!animatedValues[step.id]) {
        animatedValues[step.id] = new Animated.Value(0);
      }
    });
  });

  const handlePressStep = (step: Step, sectionIndex: number, itemIndex: number) => {
    const isCompleted = !completedSteps[step.id];
    setCompletedSteps(prev => ({ ...prev, [step.id]: isCompleted }));

    Toast.show({
      type: 'success',
      text1: step.toastText,
      position: 'bottom',
      visibilityTime: 2000,
    });

    Animated.timing(animatedValues[step.id], {
      toValue: isCompleted ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (isCompleted) {
      scrollToNextIncomplete(sectionIndex, itemIndex);
    }
  };

  const scrollToNextIncomplete = (currentSectionIndex: number, currentItemIndex: number) => {
    let found = false;
    for (let i = currentSectionIndex; i < sectionsWithIndex.length; i++) {
      const startJ = i === currentSectionIndex ? currentItemIndex + 1 : 0;
      for (let j = startJ; j < sectionsWithIndex[i].data.length; j++) {
        const step = sectionsWithIndex[i].data[j];
        if (!completedSteps[step.id]) {
          sectionListRef.current?.scrollToLocation({
            sectionIndex: i,
            itemIndex: j,
            viewPosition: 0.2,
          });
          found = true;
          break;
        }
      }
      if (found) break;
    }
  };

  const renderStep = ({ item, index, section }: SectionListRenderItemInfo<Step, ExamSection>) => {
    const isCompleted = !!completedSteps[item.id];
    const animationStyle = {
      transform: [
        {
          scale: animatedValues[item.id].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1],
          }),
        },
      ],
      opacity: animatedValues[item.id].interpolate({
        inputRange: [0, 1],
        outputRange: [0.7, 1],
      }),
    };

    return (
      <Animated.View style={animationStyle}>
        <TouchableOpacity
          style={[styles.stepContainer, isCompleted && styles.stepCompleted]}
          onPress={() => handlePressStep(item, section.index, index)}
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
        ref={sectionListRef}
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
    paddingBottom: 100, // Space for finish button
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
    backgroundColor: '#e8f5e9', // Light green
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
