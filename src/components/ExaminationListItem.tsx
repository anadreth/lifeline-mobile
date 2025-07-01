import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Exam } from '../models/exam';
import { useRouter } from 'expo-router';

interface ExaminationListItemProps {
  item: Exam;
  isDeleting: boolean;
  onAnimationComplete: () => void;
}

const ExaminationListItem = ({ item, isDeleting, onAnimationComplete }: ExaminationListItemProps) => {
  const router = useRouter();
  const animatedValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isDeleting) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false, // height is not supported by native driver
      }).start(() => {
        onAnimationComplete();
      });
    }
  }, [isDeleting, animatedValue, onAnimationComplete]);
  const progress = item.totalSteps > 0 ? (Object.values(item.completedSteps).filter(Boolean).length / item.totalSteps) * 100 : 0;
  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date(item.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const examIdSlug = `ID: ${item.id.slice(-8)}`;

  const handlePress = () => {
    router.push({ pathname: '/anamnesis', params: { examId: item.id } } as any);
  };

  const animatedContainerStyle = {
    height: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 124], // Animate to the approximate height of the item including margin
    }),
    opacity: animatedValue,
    backgroundColor: COLORS.white,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  };

  return (
    <Animated.View style={animatedContainerStyle}>
      <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.iconContainer}>
        <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
        <Text style={styles.statusText}>Status: {item.status}</Text>
        {item.status === 'in-progress' && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        )}
        <Text style={styles.slugText}>{examIdSlug}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'transparent', // Make TouchableOpacity background transparent
  },
  iconContainer: {
    backgroundColor: '#E8E1FF',
    padding: 12,
    borderRadius: 8,
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressContainer: {
    height: 6,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  slugText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});

export default ExaminationListItem;
