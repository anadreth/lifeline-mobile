import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, FlatList } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from '../../src/constants/colors';
import SearchBar from '../../src/components/common/SearchBar';
import RecordCategoryCard, { RecordCategoryCardProps } from '../../src/components/RecordCategoryCard';
import { useRouter } from 'expo-router';
import { getAllExams } from '../../src/utils/exam-storage';

// Define a more specific type for our grid items, including the possibility of being a placeholder
type CategoryGridItem = Omit<RecordCategoryCardProps, 'onPress'> & { id: string; route: string | null; empty?: boolean };

// Helper function to add placeholders to the data to ensure the grid is always full
const formatGridData = (data: CategoryGridItem[], numColumns: number) => {
  const gridData = [...data];
  const amountOfItems = gridData.length;
  const itemsToCompleteRow = numColumns - (amountOfItems % numColumns);

  if (itemsToCompleteRow > 0 && itemsToCompleteRow < numColumns) {
    for (let i = 0; i < itemsToCompleteRow; i++) {
      // Push a placeholder item. It needs an ID for the keyExtractor.
      gridData.push({ id: `placeholder-${i}`, empty: true, title: '', icon: 'add', count: 0, color: 'transparent', route: null });
    }
  }
  return gridData;
};

export default function RecordsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const numColumns = 2;
  const [categories, setCategories] = useState<CategoryGridItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const allExams = await getAllExams();
      const updatedCategories: CategoryGridItem[] = [
        { id: '7', icon: 'chatbubbles-outline', title: 'AI Anamnesis', count: allExams.length, color: '#8B5CF6', route: '/examinations' },
        { id: '1', icon: 'document-text-outline', title: 'Visit Summaries', count: 12, color: '#3B82F6', route: null },
        { id: '2', icon: 'flask-outline', title: 'Lab Results', count: 28, color: '#10B981', route: null },
        { id: '3', icon: 'pulse-outline', title: 'Vitals', count: 45, color: '#EF4444', route: null },
        { id: '4', icon: 'medkit-outline', title: 'Prescriptions', count: 8, color: '#8B5CF6', route: null },
        { id: '5', icon: 'body-outline', title: 'Allergies', count: 3, color: '#F59E0B', route: null },
        { id: '6', icon: 'document-attach-outline', title: 'Other Docs', count: 5, color: '#6366F1', route: null },
      ];
      setCategories(updatedCategories);
    };

    if (isFocused) {
      loadData();
    } else {
      // Set an initial state with 0 count when not focused to avoid flicker
      if (categories.length === 0) {
        const initialCategories: CategoryGridItem[] = [
          { id: '7', icon: 'chatbubbles-outline', title: 'AI Anamnesis', count: 0, color: '#8B5CF6', route: '/examinations' },
          { id: '1', icon: 'document-text-outline', title: 'Visit Summaries', count: 12, color: '#3B82F6', route: null },
          { id: '2', icon: 'flask-outline', title: 'Lab Results', count: 28, color: '#10B981', route: null },
          { id: '3', icon: 'pulse-outline', title: 'Vitals', count: 45, color: '#EF4444', route: null },
          { id: '4', icon: 'medkit-outline', title: 'Prescriptions', count: 8, color: '#8B5CF6', route: null },
          { id: '5', icon: 'body-outline', title: 'Allergies', count: 3, color: '#F59E0B', route: null },
          { id: '6', icon: 'document-attach-outline', title: 'Other Docs', count: 5, color: '#6366F1', route: null },
        ];
        setCategories(initialCategories);
      }
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Medical Records</Text>
        <SearchBar />
        <FlatList
          data={formatGridData(categories, numColumns)}
          renderItem={({ item }) => {
            // If the item is a placeholder, render an invisible view that takes up the same space
            if (item.empty) {
              return <View style={{ flex: 1, margin: 8 }} />;
            }
            // Otherwise, render the actual card
            return (
              <RecordCategoryCard
                icon={item.icon as any}
                title={item.title}
                count={item.count}
                color={item.color}
                onPress={() => item.route && router.push(item.route as any)}
              />
            );
          }}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
});

