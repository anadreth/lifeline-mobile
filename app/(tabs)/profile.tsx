import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, ScrollView, View } from 'react-native';
import { COLORS } from '../../src/constants/colors';
import ProfileHeader from '../../src/components/ProfileHeader';
import SettingsItem from '../../src/components/SettingsItem';

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ProfileHeader />
        <View style={styles.settingsGroup}>
          <SettingsItem icon="person-outline" label="Account Information" type="navigation" onPress={() => {}} />
          <SettingsItem 
            icon="notifications-outline"
            label="Push Notifications"
            type="toggle"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingsItem icon="lock-closed-outline" label="Privacy & Security" type="navigation" onPress={() => {}} />
        </View>
        <View style={styles.settingsGroup}>
          <SettingsItem icon="help-circle-outline" label="Help & Support" type="navigation" onPress={() => {}} />
          <SettingsItem icon="document-text-outline" label="Terms of Service" type="navigation" onPress={() => {}} />
        </View>
        <View style={styles.settingsGroup}>
          <SettingsItem icon="log-out-outline" label="Log Out" type="navigation" onPress={() => {}} isDestructive />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  settingsGroup: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
});

