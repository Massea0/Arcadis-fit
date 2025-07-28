import React from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';

export default function TestScreen() {
  const handlePress = () => {
    console.log('🧪 BOUTON PRESSÉ DANS TESTSCREEN!');
    Alert.alert('Test réussi', 'Le bouton fonctionne!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Écran de Test des Clics</Text>
      <Button
        title="APPUYEZ ICI POUR TESTER"
        onPress={handlePress}
        color="#FF6B35"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30
  }
});
