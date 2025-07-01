import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './common/Card';

export interface RecordCategoryCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  color: string;
  onPress?: () => void;
}

const RecordCategoryCard = ({ icon, title, count, color, onPress }: RecordCategoryCardProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={onPress ? 0.7 : 1}>
      <Card style={styles.card}>
        <Ionicons name={icon} size={32} color={color} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{`${count} Records`}</Text>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    aspectRatio: 1, // Make it a square
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  count: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default RecordCategoryCard;
