import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  primary: '#FF6B35',
  dark: '#2C3E50',
  light: '#ECF0F1',
};

export default function WorkoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Entraînements</Text>
      <Text style={styles.subtitle}>
        Fonctionnalité révolutionnaire en développement !
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
