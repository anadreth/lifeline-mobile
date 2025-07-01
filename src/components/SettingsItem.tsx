import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  type: 'navigation' | 'toggle';
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  isDestructive?: boolean;
}

const SettingsItem = (props: SettingsItemProps) => {
  const { icon, label, type, onPress, value, onValueChange, isDestructive } = props;
  const labelColor = isDestructive ? COLORS.danger : COLORS.text;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} disabled={!onPress}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon} size={22} color={labelColor} style={styles.icon} />
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </View>
      {type === 'navigation' && <Ionicons name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />}
      {type === 'toggle' && <Switch value={value} onValueChange={onValueChange} trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }} thumbColor={COLORS.white} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  label: {
    fontSize: 16,
  },
});

export default SettingsItem;
