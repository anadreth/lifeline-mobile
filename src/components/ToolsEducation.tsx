import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const ToolsEducation: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.headerText}>
          Available Tools {expanded ? '↑' : '↓'}
        </Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.toolsList}>
          <Text style={styles.toolItem}>• getCurrentTime - Get the current time</Text>
          <Text style={styles.toolItem}>• changeBackgroundColor - Change background color</Text>
          <Text style={styles.toolItem}>• partyMode - Enable party mode animations</Text>
          <Text style={styles.toolItem}>• launchWebsite - Open a website URL</Text>
          <Text style={styles.toolItem}>• copyToClipboard - Copy text to clipboard</Text>
          <Text style={styles.toolItem}>• scrapeWebsite - Get content from a website</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  header: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  toolsList: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  toolItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#475569',
  },
});
