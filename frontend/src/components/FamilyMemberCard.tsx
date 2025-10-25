import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';

interface FamilyMemberCardProps {
  name: string;
  relationship: string;
  avatarUrl: string;
  onPress: () => void;
}

const FamilyMemberCard = ({ name, relationship, avatarUrl, onPress }: FamilyMemberCardProps) => {
  return (
    <Card style={styles.card}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      <View style={styles.memberInfo}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.relationship}>{relationship}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>View</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: COLORS.lightGrey,
  },
  memberInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  relationship: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default FamilyMemberCard;
