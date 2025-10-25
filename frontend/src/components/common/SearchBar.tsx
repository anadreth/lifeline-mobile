import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const SearchBar = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.icon} />
      <TextInput 
        placeholder="Search records..."
        placeholderTextColor={COLORS.textSecondary}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
});

export default SearchBar;
