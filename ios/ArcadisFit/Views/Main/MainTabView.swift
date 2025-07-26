import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Dashboard Tab
            DashboardView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Accueil")
                }
                .tag(0)
            
            // Workouts Tab
            WorkoutsView()
                .tabItem {
                    Image(systemName: "dumbbell.fill")
                    Text("Entraînements")
                }
                .tag(1)
            
            // Nutrition Tab
            NutritionView()
                .tabItem {
                    Image(systemName: "leaf.fill")
                    Text("Nutrition")
                }
                .tag(2)
            
            // Gym Tab
            GymView()
                .tabItem {
                    Image(systemName: "building.2.fill")
                    Text("Salle")
                }
                .tag(3)
            
            // Profile Tab
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profil")
                }
                .tag(4)
        }
        .accentColor(Color("PrimaryColor"))
        .onAppear {
            // Set tab bar appearance
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor.systemBackground
            
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

// MARK: - Dashboard View
struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome header
                    WelcomeHeader()
                    
                    // Quick stats
                    QuickStatsView()
                    
                    // Today's workout
                    TodaysWorkoutCard()
                    
                    // Nutrition summary
                    NutritionSummaryCard()
                    
                    // Recent activities
                    RecentActivitiesView()
                    
                    // Gym membership status
                    if appState.user?.hasActiveMembership == true {
                        GymMembershipCard()
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 20)
            }
            .navigationTitle("Tableau de bord")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await viewModel.refreshData()
            }
        }
        .onAppear {
            viewModel.loadDashboardData()
        }
    }
}

struct WelcomeHeader: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Bonjour,")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    
                    Text(appState.user?.displayName ?? "Utilisateur")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                // Profile picture or placeholder
                Circle()
                    .fill(Color("PrimaryColor").opacity(0.2))
                    .frame(width: 60, height: 60)
                    .overlay(
                        Image(systemName: "person.fill")
                            .foregroundColor(Color("PrimaryColor"))
                            .font(.title2)
                    )
            }
            
            // Date
            Text(Date().formatted(date: .complete, time: .omitted))
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.top, 10)
    }
}

struct QuickStatsView: View {
    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            StatCard(
                title: "Calories",
                value: "1,850",
                unit: "kcal",
                icon: "flame.fill",
                color: .orange
            )
            
            StatCard(
                title: "Pas",
                value: "8,432",
                unit: "pas",
                icon: "figure.walk",
                color: .green
            )
            
            StatCard(
                title: "Eau",
                value: "1.8",
                unit: "L",
                icon: "drop.fill",
                color: .blue
            )
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text(unit)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct TodaysWorkoutCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Entraînement d'aujourd'hui")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("Voir tout") {
                    // Navigate to workouts
                }
                .font(.subheadline)
                .foregroundColor(Color("PrimaryColor"))
            }
            
            if let workout = getTodaysWorkout() {
                WorkoutPreviewCard(workout: workout)
            } else {
                EmptyWorkoutCard()
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
    
    private func getTodaysWorkout() -> Workout? {
        // This would come from the view model
        return Workout(
            id: "1",
            name: "Entraînement du haut du corps",
            description: "Focus sur les pectoraux, épaules et triceps",
            duration: 45,
            difficulty: .intermediate,
            exercises: [],
            createdAt: Date()
        )
    }
}

struct WorkoutPreviewCard: View {
    let workout: Workout
    
    var body: some View {
        HStack(spacing: 16) {
            // Workout icon
            Circle()
                .fill(Color("PrimaryColor").opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: "dumbbell.fill")
                        .foregroundColor(Color("PrimaryColor"))
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(workout.name)
                    .font(.headline)
                    .fontWeight(.medium)
                
                Text(workout.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                HStack(spacing: 16) {
                    Label("\(workout.duration) min", systemImage: "clock")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Label(workout.difficulty.displayName, systemImage: "star.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Button("Commencer") {
                // Start workout
            }
            .buttonStyle(PrimaryButtonStyle())
        }
    }
}

struct EmptyWorkoutCard: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "dumbbell")
                .font(.title)
                .foregroundColor(.secondary)
            
            Text("Aucun entraînement prévu")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("Planifiez votre prochain entraînement")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button("Planifier") {
                // Navigate to workout planning
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(.vertical, 20)
    }
}

struct NutritionSummaryCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Nutrition aujourd'hui")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("Voir tout") {
                    // Navigate to nutrition
                }
                .font(.subheadline)
                .foregroundColor(Color("PrimaryColor"))
            }
            
            // Macro progress
            VStack(spacing: 12) {
                MacroProgressRow(
                    name: "Protéines",
                    current: 120,
                    target: 150,
                    unit: "g",
                    color: .blue
                )
                
                MacroProgressRow(
                    name: "Glucides",
                    current: 200,
                    target: 250,
                    unit: "g",
                    color: .green
                )
                
                MacroProgressRow(
                    name: "Lipides",
                    current: 65,
                    target: 80,
                    unit: "g",
                    color: .orange
                )
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct MacroProgressRow: View {
    let name: String
    let current: Int
    let target: Int
    let unit: String
    let color: Color
    
    private var progress: Double {
        Double(current) / Double(target)
    }
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text(name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                Text("\(current)/\(target) \(unit)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            ProgressView(value: progress)
                .progressViewStyle(LinearProgressViewStyle(tint: color))
        }
    }
}

struct RecentActivitiesView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Activités récentes")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                ActivityRow(
                    icon: "dumbbell.fill",
                    title: "Entraînement terminé",
                    subtitle: "Haut du corps - 45 min",
                    time: "Il y a 2 heures",
                    color: .blue
                )
                
                ActivityRow(
                    icon: "leaf.fill",
                    title: "Repas enregistré",
                    subtitle: "Déjeuner - 650 kcal",
                    time: "Il y a 4 heures",
                    color: .green
                )
                
                ActivityRow(
                    icon: "drop.fill",
                    title: "Eau bue",
                    subtitle: "500 ml",
                    time: "Il y a 1 heure",
                    color: .cyan
                )
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct ActivityRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let time: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(color.opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: icon)
                        .foregroundColor(color)
                        .font(.subheadline)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(time)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct GymMembershipCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Adhésion salle de sport")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Text("Active")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green)
                    .cornerRadius(8)
            }
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Fitness Club Dakar")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Text("Expire le 15 décembre 2024")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button("Voir carte") {
                    // Show membership card
                }
                .buttonStyle(SecondaryButtonStyle())
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Placeholder Views for Other Tabs
struct WorkoutsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Entraînements")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Interface des entraînements à venir")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Entraînements")
        }
    }
}

struct NutritionView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Nutrition")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Interface de nutrition à venir")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Nutrition")
        }
    }
}

struct GymView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Salle de sport")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Interface de la salle à venir")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Salle")
        }
    }
}

struct ProfileView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Profil")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Interface du profil à venir")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Profil")
        }
    }
}

// MARK: - View Models
class DashboardViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var dashboardData: DashboardData?
    
    func loadDashboardData() {
        // Load dashboard data from API
        isLoading = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.isLoading = false
            // Set dashboard data
        }
    }
    
    @MainActor
    func refreshData() async {
        // Refresh dashboard data
        await Task.sleep(1_000_000_000) // 1 second
        loadDashboardData()
    }
}

struct DashboardData {
    let quickStats: QuickStats
    let todaysWorkout: Workout?
    let nutritionSummary: NutritionSummary
    let recentActivities: [Activity]
}

struct QuickStats {
    let calories: Int
    let steps: Int
    let waterIntake: Double
}

struct NutritionSummary {
    let protein: MacroProgress
    let carbs: MacroProgress
    let fat: MacroProgress
}

struct MacroProgress {
    let current: Int
    let target: Int
    let unit: String
}

struct Activity {
    let id: String
    let type: ActivityType
    let title: String
    let subtitle: String
    let timestamp: Date
}

enum ActivityType {
    case workout
    case nutrition
    case water
    case gym
}

// MARK: - Models
struct Workout {
    let id: String
    let name: String
    let description: String
    let duration: Int
    let difficulty: WorkoutDifficulty
    let exercises: [Exercise]
    let createdAt: Date
}

enum WorkoutDifficulty: String, CaseIterable {
    case beginner = "beginner"
    case intermediate = "intermediate"
    case advanced = "advanced"
    
    var displayName: String {
        switch self {
        case .beginner: return "Débutant"
        case .intermediate: return "Intermédiaire"
        case .advanced: return "Avancé"
        }
    }
}

struct Exercise {
    let id: String
    let name: String
    let sets: Int
    let reps: Int
    let weight: Double?
    let duration: Int?
}

#Preview {
    MainTabView()
        .environmentObject(AppState())
}