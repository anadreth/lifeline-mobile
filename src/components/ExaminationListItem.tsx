import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Exam } from '../models/exam';
import { useRouter } from 'expo-router';

interface ExaminationListItemProps {
  item: Exam;
}

const ExaminationListItem = ({ item }: ExaminationListItemProps) => {
  const router = useRouter();
  const progress = item.totalSteps > 0 ? (Object.values(item.completedSteps).filter(Boolean).length / item.totalSteps) * 100 : 0;
  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePress = () => {
    router.push({ pathname: '/anamnesis', params: { examId: item.id } } as any);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.iconContainer}>
        <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.statusText}>Status: {item.status}</Text>
        {item.status === 'in-progress' && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward-outline" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
});

export default ExaminationListItem;
