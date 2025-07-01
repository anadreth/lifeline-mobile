import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, FlatList } from 'react-native';
import { COLORS } from '../../src/constants/colors';
import SearchBar from '../../src/components/common/SearchBar';
import RecordCategoryCard from '../../src/components/RecordCategoryCard';

const categories = [
  { id: '1', icon: 'document-text-outline', title: 'Visit Summaries', count: 12, color: '#3B82F6' },
  { id: '2', icon: 'flask-outline', title: 'Lab Results', count: 28, color: '#10B981' },
  { id: '3', icon: 'pulse-outline', title: 'Vitals', count: 45, color: '#EF4444' },
  { id: '4', icon: 'medkit-outline', title: 'Prescriptions', count: 8, color: '#8B5CF6' },
  { id: '5', icon: 'body-outline', title: 'Allergies', count: 3, color: '#F59E0B' },
  { id: '6', icon: 'document-attach-outline', title: 'Other Docs', count: 5, color: '#6366F1' },
];

export default function RecordsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Medical Records</Text>
        <SearchBar />
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <RecordCategoryCard
              icon={item.icon as any}
              title={item.title}
              count={item.count}
              color={item.color}
              onPress={() => { /* Navigate to category details */ }}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
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

