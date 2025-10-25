import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Card from './common/Card';
import { LineChart } from 'react-native-gifted-charts';

const VitalSign = ({ icon, value, unit, label, color, onPress, isSelected }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.vitalContainer, isSelected && styles.selectedVital]}>
    <Ionicons name={icon} size={28} color={color} />
    <View style={styles.vitalTextContainer}>
      <Text style={[styles.vitalValue, { color }]}>{value}</Text>
      <Text style={styles.vitalUnit}>{unit}</Text>
    </View>
    <Text style={styles.vitalLabel}>{label}</Text>
  </TouchableOpacity>
);

const LiveVitalsCard = () => {
  const [selectedVital, setSelectedVital] = useState('heartRate');

  const vitalsData = {
    heartRate: {
      data: [
        { value: 68, label: '6 AM' }, { value: 70 }, { value: 72, label: '12 PM' },
        { value: 75 }, { value: 71, label: '6 PM' }, { value: 69 }, { value: 72, label: '12 AM' },
      ],
      color: COLORS.heartRate,
      currentValue: '72',
    },
    bloodPressure: {
      data: [
        { value: 120, label: '6 AM' }, { value: 122 }, { value: 118, label: '12 PM' },
        { value: 125 }, { value: 123, label: '6 PM' }, { value: 121 }, { value: 119, label: '12 AM' },
      ],
      color: COLORS.bloodPressure,
      currentValue: '120/80',
    },
    bloodOxygen: {
      data: [
        { value: 98, label: '6 AM' }, { value: 97 }, { value: 99, label: '12 PM' },
        { value: 98 }, { value: 97, label: '6 PM' }, { value: 98 }, { value: 99, label: '12 AM' },
      ],
      color: COLORS.bloodOxygen,
      currentValue: '98%',
    },
  };

  const currentVital = vitalsData[selectedVital as keyof typeof vitalsData];

  return (
    <Card>
      <Text style={styles.cardTitle}>Live Vitals Snapshot</Text>
      <Text style={styles.cardSubtitle}>Real-time data from your connected devices</Text>
      <View style={styles.vitalsRow}>
        <VitalSign
          icon="heart-outline"
          value={vitalsData.heartRate.currentValue}
          unit="BPM"
          label="Heart Rate"
          color={vitalsData.heartRate.color}
          isSelected={selectedVital === 'heartRate'}
          onPress={() => setSelectedVital('heartRate')}
        />
        <VitalSign
          icon="pulse-outline"
          value={vitalsData.bloodPressure.currentValue}
          unit="mmHg"
          label="Blood Pressure"
          color={vitalsData.bloodPressure.color}
          isSelected={selectedVital === 'bloodPressure'}
          onPress={() => setSelectedVital('bloodPressure')}
        />
        <VitalSign
          icon="leaf-outline"
          value={vitalsData.bloodOxygen.currentValue}
          unit="SpO2"
          label="Blood Oxygen"
          color={vitalsData.bloodOxygen.color}
          isSelected={selectedVital === 'bloodOxygen'}
          onPress={() => setSelectedVital('bloodOxygen')}
        />
      </View>
      <View style={{ paddingVertical: 20 }}>
        <LineChart
          data={currentVital.data}
          height={150}
          color1={currentVital.color}
          dataPointsColor1={currentVital.color}
          startFillColor1={currentVital.color}
          endFillColor1={COLORS.background}
          startOpacity={0.6}
          endOpacity={0.3}
          spacing={50}
          initialSpacing={10}
          noOfSections={4}
          yAxisColor={COLORS.lightText}
          xAxisColor={COLORS.lightText}
          yAxisTextStyle={{ color: COLORS.textSecondary }}
          xAxisLabelTextStyle={{ color: COLORS.textSecondary }}
          rulesColor={COLORS.lightGrey}
          curved
        />
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectedVital: {
    backgroundColor: COLORS.lightGrey,
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

});

export default LiveVitalsCard;
