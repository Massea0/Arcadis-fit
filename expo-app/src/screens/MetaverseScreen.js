import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  info: '#3498DB',
  purple: '#9B59B6'
};

export default function MetaverseScreen() {
  const enterVirtualWorld = (world) => {
    Alert.alert(
      `🌍 ${world}`,
      'Bienvenue dans le Metaverse Fitness révolutionnaire !',
      [{ text: 'Entrer', style: 'default' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[COLORS.purple, '#8E44AD', COLORS.info]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🌍 METAVERSE FITNESS</Text>
        <Text style={styles.headerSubtitle}>
          Expériences VR/AR Révolutionnaires
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>🏝️ Mondes Virtuels</Text>
        
        <TouchableOpacity 
          style={styles.worldCard}
          onPress={() => enterVirtualWorld('Plage Tropicale')}
        >
          <LinearGradient
            colors={['#3498DB', '#2ECC71']}
            style={styles.worldGradient}
          >
            <Ionicons name="sunny" size={40} color={COLORS.white} />
            <Text style={styles.worldTitle}>🏝️ Plage Tropicale</Text>
            <Text style={styles.worldDescription}>
              Entraînements beach-volley avec coach IA
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.worldCard}
          onPress={() => enterVirtualWorld('Everest VR')}
        >
          <LinearGradient
            colors={['#34495E', '#2C3E50']}
            style={styles.worldGradient}
          >
            <Ionicons name="snow" size={40} color={COLORS.white} />
            <Text style={styles.worldTitle}>🏔️ Escalade Everest</Text>
            <Text style={styles.worldDescription}>
              Défi d'endurance en haute altitude
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.worldCard}
          onPress={() => enterVirtualWorld('Espace VR')}
        >
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={styles.worldGradient}
          >
            <Ionicons name="planet" size={40} color={COLORS.white} />
            <Text style={styles.worldTitle}>🚀 Station Spatiale</Text>
            <Text style={styles.worldDescription}>
              Entraînements en gravité zéro
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>🔮 Réalité Augmentée</Text>
        
        <View style={styles.arGrid}>
          <TouchableOpacity style={styles.arCard}>
            <Ionicons name="eye" size={32} color={COLORS.primary} />
            <Text style={styles.arTitle}>👁️ Miroir IA</Text>
            <Text style={styles.arDescription}>Coach holographique</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.arCard}>
            <Ionicons name="scan" size={32} color={COLORS.info} />
            <Text style={styles.arTitle}>📱 Scan Equipment</Text>
            <Text style={styles.arDescription}>Instructions AR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.arCard}>
            <Ionicons name="game-controller" size={32} color={COLORS.success} />
            <Text style={styles.arTitle}>🎮 Gamification</Text>
            <Text style={styles.arDescription}>Workouts gamifiés</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.arCard}>
            <Ionicons name="people" size={32} color={COLORS.purple} />
            <Text style={styles.arTitle}>👥 Social VR</Text>
            <Text style={styles.arDescription}>Entraînements partagés</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>🎯 Statistiques Metaverse</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Mondes explorés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Heures VR</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Défis complétés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>127</Text>
              <Text style={styles.statLabel}>Amis virtuels</Text>
            </View>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
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
  worldCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  worldGradient: {
    padding: 20,
    alignItems: 'center',
  },
  worldTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 10,
    marginBottom: 5,
  },
  worldDescription: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  arGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  arCard: {
    width: '48%',
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
  arTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 8,
    textAlign: 'center',
  },
  arDescription: {
    fontSize: 12,
    color: COLORS.dark,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.dark,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
});