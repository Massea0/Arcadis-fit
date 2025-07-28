import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function TestButtonsScreen({ navigation }) {
  const testLoginNavigation = () => {
    console.log('Test Login Navigation');
    Alert.alert('Test', 'Bouton Login cliqué !', [
      {
        text: 'Naviguer',
        onPress: () => {
          try {
            navigation.navigate('Login');
          } catch (error) {
            console.error('Erreur navigation:', error);
            Alert.alert('Erreur', 'Impossible de naviguer: ' + error.message);
          }
        }
      },
      { text: 'Annuler', style: 'cancel' }
    ]);
  };

  const testRegisterNavigation = () => {
    console.log('Test Register Navigation');
    Alert.alert('Test', 'Bouton Register cliqué !', [
      {
        text: 'Naviguer',
        onPress: () => {
          try {
            navigation.navigate('Register');
          } catch (error) {
            console.error('Erreur navigation:', error);
            Alert.alert('Erreur', 'Impossible de naviguer: ' + error.message);
          }
        }
      },
      { text: 'Annuler', style: 'cancel' }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Test des Boutons</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.loginButton]} 
        onPress={testLoginNavigation}
      >
        <Text style={styles.buttonText}>🔐 Tester Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.registerButton]} 
        onPress={testRegisterNavigation}
      >
        <Text style={styles.buttonText}>🚀 Tester Register</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.backButton]} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>← Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
  },
  registerButton: {
    backgroundColor: '#F7931E',
  },
  backButton: {
    backgroundColor: '#2C3E50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});