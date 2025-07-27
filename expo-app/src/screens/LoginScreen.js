import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7931E',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF'
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('demo@arcadisfit.com');
  const [password, setPassword] = useState('demo123');

  const handleLogin = () => {
    Alert.alert(
      '🎉 Connexion Réussie !',
      'Bienvenue dans Arcadis Fit Revolution !',
      [
        {
          text: 'Continuer',
          onPress: () => {
            // Ici on devrait naviguer vers l'app principale
            // Pour la démo, on simule juste
            navigation.navigate('Welcome');
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="fitness" size={60} color={COLORS.white} />
          <Text style={styles.title}>🔐 Connexion</Text>
          <Text style={styles.subtitle}>Accédez à votre compte Arcadis Fit</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>🚀 SE CONNECTER</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              Pas de compte ? 📝 S'inscrire
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.light,
    marginBottom: 20,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: COLORS.dark,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});