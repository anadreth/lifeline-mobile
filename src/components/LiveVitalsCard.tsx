import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';

const VitalSign = ({ icon, value, unit, label, color }: any) => (
  <View style={styles.vitalContainer}>
    <Ionicons name={icon} size={28} color={color} />
    <View style={styles.vitalTextContainer}>
      <Text style={[styles.vitalValue, { color }]}>{value}</Text>
      <Text style={styles.vitalUnit}>{unit}</Text>
    </View>
    <Text style={styles.vitalLabel}>{label}</Text>
  </View>
);

const LiveVitalsCard = () => {
  return (
    <Card>
      <Text style={styles.cardTitle}>Live Vitals Snapshot</Text>
      <Text style={styles.cardSubtitle}>Real-time data from your connected devices</Text>
      <View style={styles.vitalsRow}>
        <VitalSign icon="heart-outline" value="72" unit="BPM" label="Heart Rate" color={COLORS.heartRate} />
        <VitalSign icon="pulse-outline" value="120/80" unit="mmHg" label="Blood Pressure" color={COLORS.bloodPressure} />
        <VitalSign icon="leaf-outline" value="98%" unit="SpO2" label="Blood Oxygen" color={COLORS.bloodOxygen} />
      </View>
      {/* Placeholder for the graph */}
      <View style={styles.graphPlaceholder}>
        <Text style={styles.placeholderText}>Vitals Graph Area</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  vitalContainer: {
    alignItems: 'center',
    flex: 1,
  },
  vitalTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  vitalUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  vitalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  graphPlaceholder: {
    height: 150,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.lightText,
    fontSize: 16,
  },
});

export default LiveVitalsCard;
