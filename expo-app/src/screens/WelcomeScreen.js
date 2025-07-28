import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ImageBackground,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7931E',
  accent: '#FFD23F',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF'
};

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animation d'entrée révolutionnaire
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLoginPress = () => {
    console.log('🔐 BOUTON LOGIN PRESSÉ !');
    Alert.alert(
      'Test Navigation',
      'Le bouton "J\'ai déjà un compte" a été pressé !',
      [
        {
          text: 'Aller à Login',
          onPress: () => {
            console.log('Navigation vers Login...');
            navigation.navigate('Login');
          }
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const handleRegisterPress = () => {
    console.log('🚀 BOUTON REGISTER PRESSÉ !');
    Alert.alert(
      'Test Navigation',
      'Le bouton "Commencer la révolution" a été pressé !',
      [
        {
          text: 'Aller à Register',
          onPress: () => {
            console.log('Navigation vers Register...');
            navigation.navigate('Register');
          }
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Logo et titre révolutionnaire */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="fitness" size={80} color={COLORS.white} />
              <View style={styles.brainIcon}>
                <Ionicons name="brain" size={40} color={COLORS.accent} />
              </View>
            </View>
            
            <Text style={styles.title}>🚀 ARCADIS FIT</Text>
            <Text style={styles.subtitle}>RÉVOLUTION</Text>
            
            <View style={styles.taglineContainer}>
              <Text style={styles.tagline}>
                LA PREMIÈRE PLATEFORME FITNESS
              </Text>
              <Text style={styles.taglineHighlight}>
                AVEC IA RÉVOLUTIONNAIRE 🧠
              </Text>
            </View>
          </View>

          {/* Fonctionnalités révolutionnaires */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <View style={styles.feature}>
                <Ionicons name="scan" size={24} color={COLORS.white} />
                <Text style={styles.featureText}>Prédiction Blessures</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="mic" size={24} color={COLORS.white} />
                <Text style={styles.featureText}>Analyse Émotions</Text>
              </View>
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.feature}>
                <Ionicons name="location" size={24} color={COLORS.white} />
                <Text style={styles.featureText}>Coach IA 24/7</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="planet" size={24} color={COLORS.white} />
                <Text style={styles.featureText}>Metaverse VR</Text>
              </View>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegisterPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.white, COLORS.light]}
                style={styles.buttonGradient}
              >
                <Ionicons name="rocket" size={24} color={COLORS.primary} />
                <Text style={styles.primaryButtonText}>
                  🚀 COMMENCER LA RÉVOLUTION
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                🔐 J'ai déjà un compte
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 10 }]}
              onPress={() => navigation.navigate('TestButtons')}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { fontSize: 14 }]}>
                🧪 Test Boutons (Debug)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Badge révolutionnaire */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons name="star" size={16} color={COLORS.accent} />
              <Text style={styles.badgeText}>
                IA + METAVERSE + BLOCKCHAIN
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Éléments décoratifs animés */}
        <View style={styles.decorativeElements}>
          <Animated.View
            style={[
              styles.floatingIcon,
              styles.floatingIcon1,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons name="barbell" size={30} color={COLORS.white} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.floatingIcon,
              styles.floatingIcon2,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons name="nutrition" size={25} color={COLORS.white} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.floatingIcon,
              styles.floatingIcon3,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons name="heart" size={20} color={COLORS.white} />
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  brainIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    padding: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 3,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  taglineHighlight: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  featuresContainer: {
    marginVertical: 30,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  feature: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
    minWidth: 120,
  },
  featureText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    marginBottom: 15,
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
    letterSpacing: 1,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
    opacity: 0.3,
  },
  floatingIcon1: {
    top: '15%',
    right: '10%',
  },
  floatingIcon2: {
    top: '45%',
    left: '5%',
  },
  floatingIcon3: {
    bottom: '25%',
    right: '15%',
  },
});