import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Exam } from '../models/exam';
import { getAllExams, deleteExamById } from '../utils/exam-storage';

interface DashboardScreenProps {
  onStartExam: (examId?: string) => void;
}

const DashboardScreen = ({ onStartExam }: DashboardScreenProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  useFocusEffect(
    useCallback(() => {
      const fetchExams = async () => {
        const allExams = await getAllExams();
        setExams(allExams);
      };
      fetchExams();
    }, [])
  );

  const handleDelete = async (examId: string) => {
    swipeableRefs.current[examId]?.close();
    await deleteExamById(examId);
    setExams((prevExams: Exam[]) => prevExams.filter((exam: Exam) => exam.id !== examId));
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, examId: string) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={() => handleDelete(examId)} style={styles.deleteAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color={COLORS.white} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderExamItem = ({ item }: { item: Exam }) => (
    <Swipeable
      ref={(ref: Swipeable | null) => { swipeableRefs.current[item.id] = ref; }}
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity style={styles.itemContainer} onPress={() => onStartExam(item.id)} disabled={item.status === 'completed'}>
        <View>
          <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleString()}</Text>
          <Text style={[styles.itemStatus, { color: item.status === 'completed' ? COLORS.success : COLORS.warning }]}>
            {item.status === 'completed' ? 'Completed' : 'In Progress'}
          </Text>
        </View>
        {item.status === 'in-progress' && <Button title="Continue" onPress={() => onStartExam(item.id)} />}
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Examinations</Text>
      <FlatList
        data={exams}
        renderItem={renderExamItem}
        keyExtractor={(item: Exam) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No examinations found.</Text>}
      />
      <Button title="Start New Anamnesis" onPress={() => onStartExam()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  itemContainer: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: COLORS.lightText,
  },
  deleteAction: {
    backgroundColor: '#dd2c00',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 10,
    marginBottom: 10,
  },
});

export default DashboardScreen;
