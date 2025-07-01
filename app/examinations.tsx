import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/colors';
import { Exam } from '../src/models/exam';
import { getAllExams, deleteExamById } from '../src/utils/exam-storage';
import ExaminationListItem from '../src/components/ExaminationListItem';

export default function ExaminationsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [selectedTab, setSelectedTab] = useState<'in-progress' | 'completed'>('in-progress');
  const [exams, setExams] = useState<Exam[]>([]);
  const [pendingDeletionId, setPendingDeletionId] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    const allExams = await getAllExams();
    const filteredExams = allExams.filter(exam => exam.status === selectedTab);
    setExams(filteredExams);
  }, [selectedTab]);

  useEffect(() => {
    if (isFocused) {
      fetchExams();
    }
  }, [isFocused, fetchExams]);

  const onDeleteAnimationComplete = async (examId: string) => {
    await deleteExamById(examId);
    setExams(prevExams => prevExams.filter(exam => exam.id !== examId));
    setPendingDeletionId(null);
  };

  const handleDeleteExam = (examId: string) => {
    Alert.alert(
      'Delete Examination',
      'Are you sure you want to delete this examination? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPendingDeletionId(examId);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Exam }) => (
    <ExaminationListItem
      item={item}
      isDeleting={item.id === pendingDeletionId}
      onAnimationComplete={() => onDeleteAnimationComplete(item.id)}
    />
  );

  const renderHiddenItem = (data: { item: Exam }, rowMap: { [key: string]: any }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => {
          // Close the row first, then trigger the delete confirmation
          if (rowMap[data.item.id]) {
            rowMap[data.item.id].closeRow();
          }
          handleDeleteExam(data.item.id);
        }}
      >
        <Ionicons name="trash-outline" size={24} color={COLORS.white} />
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Examinations</Text>
      </View>

      <View style={styles.segmentedControlContainer}>
        <TouchableOpacity
          style={[styles.segment, selectedTab === 'in-progress' && styles.segmentActive]}
          onPress={() => setSelectedTab('in-progress')}
        >
          <Text style={[styles.segmentText, selectedTab === 'in-progress' && styles.segmentTextActive]}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, selectedTab === 'completed' && styles.segmentActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.segmentText, selectedTab === 'completed' && styles.segmentTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <SwipeListView
        data={exams}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        keyExtractor={(item) => item.id}
        rightOpenValue={-90}
        disableRightSwipe
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  backButton: { position: 'absolute', left: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  segmentedControlContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGrey,
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 16, color: COLORS.textSecondary },
  segmentTextActive: { color: COLORS.white, fontWeight: '600' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  rowBack: {
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    height: 124, // Explicitly set height to match the item
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 90,
  },
  backRightBtnRight: {
    backgroundColor: 'transparent',
    right: 0,
  },
  backTextWhite: { color: COLORS.white, marginTop: 4 },
});
