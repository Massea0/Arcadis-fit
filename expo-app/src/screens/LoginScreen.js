import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7931E',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF'
};

export default function LoginScreen({ navigation }) {
  const handleLogin = () => {
    console.log('LOGIN BUTTON PRESSED!');
    Alert.alert(
      '🎉 SUCCÈS !',
      'Le bouton fonctionne parfaitement ! Les clics sont réparés ! 🚀'
    );
  };

  const handleBack = () => {
    console.log('BACK BUTTON PRESSED!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="fitness" size={60} color={COLORS.primary} />
        <Text style={styles.title}>🔐 Test de Connexion</Text>
        <Text style={styles.subtitle}>Test avec Button natif</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="🧪 TESTER LE CLIC"
          onPress={handleLogin}
          color={COLORS.primary}
        />

        <View style={{height: 20}} />
        
        <Button
          title="← Retour"
          onPress={handleBack} 
          color={COLORS.secondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.dark,
    opacity: 0.7,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
    minWidth: 250,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
  },
});