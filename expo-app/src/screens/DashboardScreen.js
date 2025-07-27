import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7931E',
  accent: '#FFD23F',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF',
  success: '#27AE60',
  info: '#3498DB'
};

export default function DashboardScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header révolutionnaire */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Bonjour ! 👋</Text>
          <Text style={styles.userName}>Utilisateur Demo</Text>
          <Text style={styles.subtitle}>🚀 Prêt pour la révolution fitness ?</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Jours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8.5</Text>
            <Text style={styles.statLabel}>kg perdus</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Actions révolutionnaires */}
        <Text style={styles.sectionTitle}>🚀 Actions Rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('AIBrain')}
          >
            <LinearGradient
              colors={[COLORS.info, '#2980B9']}
              style={styles.actionGradient}
            >
              <Ionicons name="brain" size={32} color={COLORS.white} />
              <Text style={styles.actionText}>🧠 IA Brain</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Metaverse')}
          >
            <LinearGradient
              colors={[COLORS.accent, '#F1C40F']}
              style={styles.actionGradient}
            >
              <Ionicons name="planet" size={32} color={COLORS.white} />
              <Text style={styles.actionText}>🌍 Metaverse</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Workout')}
          >
            <LinearGradient
              colors={[COLORS.success, '#229954']}
              style={styles.actionGradient}
            >
              <Ionicons name="fitness" size={32} color={COLORS.white} />
              <Text style={styles.actionText}>💪 Workout</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Nutrition')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.actionGradient}
            >
              <Ionicons name="restaurant" size={32} color={COLORS.white} />
              <Text style={styles.actionText}>🥗 Nutrition</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Fonctionnalités révolutionnaires */}
        <Text style={styles.sectionTitle}>🌟 Fonctionnalités Révolutionnaires</Text>
        
        <TouchableOpacity style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Ionicons name="scan" size={24} color={COLORS.primary} />
            <Text style={styles.featureTitle}>🔮 Prédiction de Blessures</Text>
          </View>
          <Text style={styles.featureDescription}>
            IA révolutionnaire qui prédit les blessures avant qu'elles arrivent
          </Text>
          <View style={styles.featureBadge}>
            <Text style={styles.badgeText}>NOUVEAU</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Ionicons name="mic" size={24} color={COLORS.info} />
            <Text style={styles.featureTitle}>🎭 Analyse Émotionnelle</Text>
          </View>
          <Text style={styles.featureDescription}>
            Détection d'émotions par la voix pour adapter votre entraînement
          </Text>
          <View style={styles.featureBadge}>
            <Text style={styles.badgeText}>RÉVOLUTIONNAIRE</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Ionicons name="location" size={24} color={COLORS.success} />
            <Text style={styles.featureTitle}>🌍 Coach IA Géolocalisé</Text>
          </View>
          <Text style={styles.featureDescription}>
            Coach personnel qui s'adapte à votre environnement en temps réel
          </Text>
          <View style={styles.featureBadge}>
            <Text style={styles.badgeText}>UNIQUE</Text>
          </View>
        </TouchableOpacity>

        {/* Progrès aujourd'hui */}
        <Text style={styles.sectionTitle}>📊 Progrès d'Aujourd'hui</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressItem}>
            <Ionicons name="flame" size={20} color={COLORS.primary} />
            <Text style={styles.progressLabel}>Calories</Text>
            <Text style={styles.progressValue}>450 / 2000</Text>
          </View>
          
          <View style={styles.progressItem}>
            <Ionicons name="footsteps" size={20} color={COLORS.info} />
            <Text style={styles.progressLabel}>Pas</Text>
            <Text style={styles.progressValue}>7,234 / 10,000</Text>
          </View>
          
          <View style={styles.progressItem}>
            <Ionicons name="water" size={20} color={COLORS.success} />
            <Text style={styles.progressLabel}>Eau</Text>
            <Text style={styles.progressValue}>1.2L / 2.5L</Text>
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
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    position: 'relative',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 12,
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.dark,
    opacity: 0.7,
    lineHeight: 20,
  },
  featureBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 12,
    flex: 1,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});