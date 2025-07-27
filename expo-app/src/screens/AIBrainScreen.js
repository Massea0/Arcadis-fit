import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7931E',
  accent: '#FFD23F',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF',
  success: '#27AE60',
  danger: '#E74C3C',
  info: '#3498DB'
};

export default function AIBrainScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [emotionalState, setEmotionalState] = useState(null);
  const [coachActive, setCoachActive] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation du cerveau qui pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation de rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const startInjuryAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulation de l'analyse IA révolutionnaire
    setTimeout(() => {
      const mockPrediction = {
        overall_risk: Math.floor(Math.random() * 100),
        risk_level: ['LOW', 'MODERATE', 'HIGH'][Math.floor(Math.random() * 3)],
        specific_risks: {
          knee_injury: Math.floor(Math.random() * 50),
          back_injury: Math.floor(Math.random() * 60),
          shoulder_injury: Math.floor(Math.random() * 40),
        },
        prevention_actions: [
          'Échauffement prolongé de 15 minutes',
          'Étirements spécifiques post-entraînement',
          'Surveillance de la charge d\'entraînement'
        ]
      };
      
      setPredictions(mockPrediction);
      setIsAnalyzing(false);
      
      Alert.alert(
        '🔮 Analyse Terminée',
        `Risque général: ${mockPrediction.overall_risk}% (${mockPrediction.risk_level})`,
        [{ text: 'Voir les détails', style: 'default' }]
      );
    }, 3000);
  };

  const analyzeEmotions = async () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const emotions = ['Motivé', 'Énergique', 'Fatigué', 'Stressé', 'Confiant'];
      const mockEmotion = {
        primary_emotion: emotions[Math.floor(Math.random() * emotions.length)],
        energy_level: Math.floor(Math.random() * 100),
        stress_indicators: Math.floor(Math.random() * 50),
        motivation_score: Math.floor(Math.random() * 100)
      };
      
      setEmotionalState(mockEmotion);
      setIsAnalyzing(false);
      
      Alert.alert(
        '🎭 Analyse Émotionnelle',
        `État: ${mockEmotion.primary_emotion}\nÉnergie: ${mockEmotion.energy_level}%`,
        [{ text: 'Adapter l\'entraînement', style: 'default' }]
      );
    }, 2500);
  };

  const activateAICoach = () => {
    setCoachActive(!coachActive);
    
    if (!coachActive) {
      Alert.alert(
        '🤖 Coach IA Activé',
        'Votre coach personnel IA est maintenant actif et vous guidera en temps réel !',
        [{ text: 'Parfait !', style: 'default' }]
      );
    } else {
      Alert.alert(
        '😴 Coach IA Désactivé',
        'Votre coach IA est maintenant en pause.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <Animated.View
          style={[
            styles.brainContainer,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: spin }
              ]
            }
          ]}
        >
          <Ionicons name="brain" size={80} color={COLORS.white} />
        </Animated.View>
        
        <Text style={styles.headerTitle}>🧠 ARCADIS BRAIN</Text>
        <Text style={styles.headerSubtitle}>
          Intelligence Artificielle Révolutionnaire
        </Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, coachActive && styles.statusActive]} />
          <Text style={styles.statusText}>
            {coachActive ? '🟢 IA ACTIVE' : '🔴 IA EN VEILLE'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Fonctionnalités IA principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Fonctionnalités Révolutionnaires</Text>
          
          <TouchableOpacity
            style={styles.featureCard}
            onPress={startInjuryAnalysis}
            disabled={isAnalyzing}
          >
            <LinearGradient
              colors={[COLORS.danger, '#C0392B']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="scan" size={32} color={COLORS.white} />
                <Text style={styles.cardTitle}>🔮 Prédiction Blessures</Text>
              </View>
              <Text style={styles.cardDescription}>
                Analyse vos patterns de mouvement pour prédire les blessures avant qu'elles arrivent
              </Text>
              {isAnalyzing && (
                <Text style={styles.analyzingText}>🔄 Analyse en cours...</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={analyzeEmotions}
            disabled={isAnalyzing}
          >
            <LinearGradient
              colors={[COLORS.info, '#2980B9']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="mic" size={32} color={COLORS.white} />
                <Text style={styles.cardTitle}>🎭 Analyse Émotions</Text>
              </View>
              <Text style={styles.cardDescription}>
                Détecte votre état émotionnel par la voix pour adapter votre entraînement
              </Text>
              {isAnalyzing && (
                <Text style={styles.analyzingText}>🔄 Écoute en cours...</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={activateAICoach}
          >
            <LinearGradient
              colors={coachActive ? [COLORS.success, '#229954'] : [COLORS.primary, COLORS.secondary]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Ionicons 
                  name={coachActive ? "checkmark-circle" : "location"} 
                  size={32} 
                  color={COLORS.white} 
                />
                <Text style={styles.cardTitle}>
                  {coachActive ? '✅ Coach Actif' : '🌍 Coach IA 24/7'}
                </Text>
              </View>
              <Text style={styles.cardDescription}>
                Coach personnel géolocalisé qui s'adapte à votre environnement en temps réel
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Résultats des analyses */}
        {predictions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Prédiction des Blessures</Text>
            <View style={styles.resultCard}>
              <View style={styles.riskIndicator}>
                <Text style={styles.riskScore}>{predictions.overall_risk}%</Text>
                <Text style={[
                  styles.riskLevel,
                  predictions.risk_level === 'LOW' && styles.riskLow,
                  predictions.risk_level === 'MODERATE' && styles.riskModerate,
                  predictions.risk_level === 'HIGH' && styles.riskHigh
                ]}>
                  {predictions.risk_level}
                </Text>
              </View>
              
              <View style={styles.specificRisks}>
                <Text style={styles.risksTitle}>Risques Spécifiques:</Text>
                <Text style={styles.riskItem}>🦵 Genoux: {predictions.specific_risks.knee_injury}%</Text>
                <Text style={styles.riskItem}>🎯 Dos: {predictions.specific_risks.back_injury}%</Text>
                <Text style={styles.riskItem}>💪 Épaules: {predictions.specific_risks.shoulder_injury}%</Text>
              </View>
              
              <View style={styles.preventionActions}>
                <Text style={styles.preventionTitle}>🛡️ Actions Préventives:</Text>
                {predictions.prevention_actions.map((action, index) => (
                  <Text key={index} style={styles.actionItem}>• {action}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {emotionalState && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 État Émotionnel</Text>
            <View style={styles.resultCard}>
              <View style={styles.emotionContainer}>
                <Text style={styles.primaryEmotion}>
                  {emotionalState.primary_emotion}
                </Text>
                <View style={styles.emotionStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Énergie</Text>
                    <Text style={styles.statValue}>{emotionalState.energy_level}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Stress</Text>
                    <Text style={styles.statValue}>{emotionalState.stress_indicators}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Motivation</Text>
                    <Text style={styles.statValue}>{emotionalState.motivation_score}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Fonctionnalités avancées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔬 Fonctionnalités Avancées</Text>
          
          <View style={styles.advancedGrid}>
            <TouchableOpacity style={styles.advancedCard}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
              <Text style={styles.advancedText}>📸 Scan Aliments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.advancedCard}>
              <Ionicons name="heart" size={24} color={COLORS.danger} />
              <Text style={styles.advancedText}>❤️ Monitoring Santé</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.advancedCard}>
              <Ionicons name="trophy" size={24} color={COLORS.accent} />
              <Text style={styles.advancedText}>🏆 Gamification</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.advancedCard}>
              <Ionicons name="planet" size={24} color={COLORS.info} />
              <Text style={styles.advancedText}>🌍 Metaverse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  brainContainer: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  featureCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 12,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  analyzingText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  riskIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  riskScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  riskLow: {
    color: COLORS.success,
  },
  riskModerate: {
    color: '#F39C12',
  },
  riskHigh: {
    color: COLORS.danger,
  },
  specificRisks: {
    marginBottom: 15,
  },
  risksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  riskItem: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 4,
  },
  preventionActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    paddingTop: 15,
  },
  preventionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  actionItem: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 4,
    lineHeight: 18,
  },
  emotionContainer: {
    alignItems: 'center',
  },
  primaryEmotion: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  emotionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.dark,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  advancedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  advancedCard: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  advancedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 8,
    textAlign: 'center',
  },
});