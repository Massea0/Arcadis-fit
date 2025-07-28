import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

export default function SimpleTestScreen({ navigation }) {
  const handlePressTest = () => {
    console.log('===> BOUTON DE TEST PRESSÉ');
    Alert.alert('TEST RÉUSSI', 'Le bouton fonctionne correctement!');
  };
  
  const handlePressNavigate = () => {
    console.log('===> BOUTON DE NAVIGATION PRESSÉ');
    Alert.alert('TEST DE NAVIGATION', 'Tentative de navigation vers Login...');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Simple des Clics</Text>
      
      <Button
        title="TEST CLIC - ALERTE"
        onPress={handlePressTest}
        color="#FF6B35"
      />
      
      <View style={styles.spacer} />
      
      <Button
        title="TEST CLIC - NAVIGATION"
        onPress={handlePressNavigate}
        color="#F7931E"
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
});
