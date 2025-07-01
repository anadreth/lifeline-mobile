import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import FamilyMemberCard from '../../src/components/FamilyMemberCard';

const familyMembers = [
  {
    id: '1',
    name: 'Eleanor Pena',
    relationship: 'Mother',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  },
  {
    id: '2',
    name: 'Cody Fisher',
    relationship: 'Son',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
  },
  {
    id: '3',
    name: 'Esther Howard',
    relationship: 'Spouse',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
  },
];

export default function FamilyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Family Circle</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add Member</Text>
          </TouchableOpacity>
        </View>
        {familyMembers.map((member) => (
          <FamilyMemberCard 
            key={member.id}
            name={member.name}
            relationship={member.relationship}
            avatarUrl={member.avatarUrl}
            onPress={() => { /* Navigate to member details */ }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 6,
  },
});

