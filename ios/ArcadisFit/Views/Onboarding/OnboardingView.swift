import SwiftUI
import Combine

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var authManager: AuthenticationManager
    @StateObject private var viewModel = OnboardingViewModel()
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color("PrimaryColor"),
                        Color("SecondaryColor")
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Progress indicator
                    ProgressView(value: viewModel.currentStep, total: 6)
                        .progressViewStyle(LinearProgressViewStyle(tint: .white))
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    
                    // Content area
                    TabView(selection: $viewModel.currentStep) {
                        // Welcome Screen
                        WelcomeScreen()
                            .tag(1)
                        
                        // Registration Screen
                        RegistrationScreen(viewModel: viewModel)
                            .tag(2)
                        
                        // Phone Verification Screen
                        PhoneVerificationScreen(viewModel: viewModel)
                            .tag(3)
                        
                        // Profile Setup Screen
                        ProfileSetupScreen(viewModel: viewModel)
                            .tag(4)
                        
                        // Fitness Goals Screen
                        FitnessGoalsScreen(viewModel: viewModel)
                            .tag(5)
                        
                        // Location Permission Screen
                        LocationPermissionScreen(viewModel: viewModel)
                            .tag(6)
                    }
                    .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                    .animation(.easeInOut, value: viewModel.currentStep)
                    
                    // Navigation buttons
                    HStack {
                        if viewModel.currentStep > 1 {
                            Button("Précédent") {
                                withAnimation {
                                    viewModel.currentStep -= 1
                                }
                            }
                            .buttonStyle(SecondaryButtonStyle())
                        }
                        
                        Spacer()
                        
                        Button(viewModel.currentStep == 6 ? "Terminer" : "Suivant") {
                            viewModel.handleNextStep()
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(!viewModel.canProceed)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
            .navigationBarHidden(true)
        }
        .alert("Erreur", isPresented: $viewModel.showError) {
            Button("OK") { }
        } message: {
            Text(viewModel.errorMessage)
        }
        .onReceive(viewModel.$onboardingCompleted) { completed in
            if completed {
                appState.onboardingCompleted = true
            }
        }
    }
}

// MARK: - Welcome Screen
struct WelcomeScreen: View {
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // App logo
            Image("AppLogo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 120, height: 120)
                .padding(.bottom, 20)
            
            // Welcome text
            VStack(spacing: 16) {
                Text("Bienvenue sur Arcadis Fit")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                
                Text("Votre compagnon fitness personnalisé pour le Sénégal")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            // Features list
            VStack(spacing: 12) {
                FeatureRow(icon: "dumbbell.fill", text: "Entraînements personnalisés")
                FeatureRow(icon: "leaf.fill", text: "Nutrition adaptée au Sénégal")
                FeatureRow(icon: "heart.fill", text: "Suivi de santé intelligent")
                FeatureRow(icon: "creditcard.fill", text: "Paiements mobiles locaux")
            }
            .padding(.horizontal, 40)
            
            Spacer()
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.white)
                .frame(width: 24, height: 24)
            
            Text(text)
                .font(.body)
                .foregroundColor(.white.opacity(0.9))
            
            Spacer()
        }
    }
}

// MARK: - Registration Screen
struct RegistrationScreen: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 30) {
            VStack(spacing: 16) {
                Text("Créer votre compte")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Commencez votre voyage fitness")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.9))
            }
            .padding(.top, 40)
            
            VStack(spacing: 20) {
                // Full name
                CustomTextField(
                    text: $viewModel.fullName,
                    placeholder: "Nom complet",
                    icon: "person.fill"
                )
                
                // Email
                CustomTextField(
                    text: $viewModel.email,
                    placeholder: "Email",
                    icon: "envelope.fill",
                    keyboardType: .emailAddress
                )
                
                // Password
                CustomSecureField(
                    text: $viewModel.password,
                    placeholder: "Mot de passe",
                    icon: "lock.fill"
                )
                
                // Confirm password
                CustomSecureField(
                    text: $viewModel.confirmPassword,
                    placeholder: "Confirmer le mot de passe",
                    icon: "lock.fill"
                )
                
                // Phone number
                CustomTextField(
                    text: $viewModel.phoneNumber,
                    placeholder: "Numéro de téléphone",
                    icon: "phone.fill",
                    keyboardType: .phonePad
                )
                .onAppear {
                    if viewModel.phoneNumber.isEmpty {
                        viewModel.phoneNumber = "+221"
                    }
                }
            }
            .padding(.horizontal, 20)
            
            Spacer()
        }
    }
}

// MARK: - Phone Verification Screen
struct PhoneVerificationScreen: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 30) {
            VStack(spacing: 16) {
                Text("Vérification téléphonique")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Nous avons envoyé un code à \(viewModel.phoneNumber)")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 40)
            
            // Verification code input
            VStack(spacing: 20) {
                HStack(spacing: 12) {
                    ForEach(0..<6) { index in
                        VerificationCodeDigit(
                            digit: viewModel.verificationCode.count > index ? 
                                String(viewModel.verificationCode[viewModel.verificationCode.index(viewModel.verificationCode.startIndex, offsetBy: index)]) : "",
                            isActive: viewModel.verificationCode.count == index
                        )
                    }
                }
                .padding(.horizontal, 20)
                
                // Hidden text field for input
                TextField("", text: $viewModel.verificationCode)
                    .keyboardType(.numberPad)
                    .opacity(0)
                    .frame(height: 1)
                    .onChange(of: viewModel.verificationCode) { newValue in
                        if newValue.count > 6 {
                            viewModel.verificationCode = String(newValue.prefix(6))
                        }
                    }
                
                // Resend code button
                Button("Renvoyer le code") {
                    viewModel.resendVerificationCode()
                }
                .foregroundColor(.white)
                .font(.body)
                .disabled(viewModel.resendCodeDisabled)
                
                if viewModel.resendCodeDisabled {
                    Text("Renvoyer dans \(viewModel.resendCodeCountdown)s")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            
            Spacer()
        }
    }
}

struct VerificationCodeDigit: View {
    let digit: String
    let isActive: Bool
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.2))
                .frame(width: 50, height: 60)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isActive ? Color.white : Color.clear, lineWidth: 2)
                )
            
            Text(digit)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }
}

// MARK: - Profile Setup Screen
struct ProfileSetupScreen: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 30) {
            VStack(spacing: 16) {
                Text("Profil personnel")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Aidez-nous à personnaliser votre expérience")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.9))
            }
            .padding(.top, 40)
            
            ScrollView {
                VStack(spacing: 20) {
                    // Date of birth
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date de naissance")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        DatePicker("", selection: $viewModel.dateOfBirth, displayedComponents: .date)
                            .datePickerStyle(WheelDatePickerStyle())
                            .labelsHidden()
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(12)
                    }
                    
                    // Gender selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Genre")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        HStack(spacing: 12) {
                            ForEach(Gender.allCases, id: \.self) { gender in
                                GenderButton(
                                    gender: gender,
                                    isSelected: viewModel.gender == gender,
                                    action: { viewModel.gender = gender }
                                )
                            }
                        }
                    }
                    
                    // Height
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Taille")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        HStack {
                            CustomTextField(
                                text: $viewModel.heightCm,
                                placeholder: "cm",
                                icon: "ruler.fill",
                                keyboardType: .numberPad
                            )
                            
                            Text("cm")
                                .foregroundColor(.white)
                                .font(.body)
                        }
                    }
                    
                    // Weight
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Poids")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        HStack {
                            CustomTextField(
                                text: $viewModel.weightKg,
                                placeholder: "kg",
                                icon: "scalemass.fill",
                                keyboardType: .decimalPad
                            )
                            
                            Text("kg")
                                .foregroundColor(.white)
                                .font(.body)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            
            Spacer()
        }
    }
}

struct GenderButton: View {
    let gender: Gender
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(gender.displayName)
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? Color("PrimaryColor") : .white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(isSelected ? Color.white : Color.white.opacity(0.2))
                )
        }
    }
}

// MARK: - Fitness Goals Screen
struct FitnessGoalsScreen: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    private let availableGoals = [
        "Perte de poids",
        "Prise de masse musculaire",
        "Amélioration de l'endurance",
        "Tonification",
        "Santé générale",
        "Performance sportive"
    ]
    
    var body: some View {
        VStack(spacing: 30) {
            VStack(spacing: 16) {
                Text("Objectifs fitness")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Sélectionnez vos objectifs principaux")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.9))
            }
            .padding(.top, 40)
            
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    ForEach(availableGoals, id: \.self) { goal in
                        GoalCard(
                            goal: goal,
                            isSelected: viewModel.fitnessGoals.contains(goal),
                            action: {
                                if viewModel.fitnessGoals.contains(goal) {
                                    viewModel.fitnessGoals.removeAll { $0 == goal }
                                } else {
                                    viewModel.fitnessGoals.append(goal)
                                }
                            }
                        )
                    }
                }
                .padding(.horizontal, 20)
            }
            
            Spacer()
        }
    }
}

struct GoalCard: View {
    let goal: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: goalIcon(for: goal))
                    .font(.title2)
                    .foregroundColor(isSelected ? Color("PrimaryColor") : .white)
                
                Text(goal)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? Color("PrimaryColor") : .white)
                    .multilineTextAlignment(.center)
            }
            .frame(height: 100)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.white : Color.white.opacity(0.2))
            )
        }
    }
    
    private func goalIcon(for goal: String) -> String {
        switch goal {
        case "Perte de poids": return "arrow.down.circle.fill"
        case "Prise de masse musculaire": return "dumbbell.fill"
        case "Amélioration de l'endurance": return "heart.circle.fill"
        case "Tonification": return "figure.walk"
        case "Santé générale": return "cross.fill"
        case "Performance sportive": return "trophy.fill"
        default: return "target"
        }
    }
}

// MARK: - Location Permission Screen
struct LocationPermissionScreen: View {
    @ObservedObject var viewModel: OnboardingViewModel
    @EnvironmentObject var locationManager: LocationManager
    
    var body: some View {
        VStack(spacing: 30) {
            VStack(spacing: 16) {
                Text("Localisation")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Nous utilisons votre localisation pour vous proposer des salles de sport à proximité")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 40)
            
            VStack(spacing: 20) {
                Image(systemName: "location.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.white)
                
                VStack(spacing: 12) {
                    Text("Avantages de la localisation :")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        LocationBenefitRow(text: "Trouver des salles de sport proches")
                        LocationBenefitRow(text: "Recevoir des offres locales")
                        LocationBenefitRow(text: "Améliorer les recommandations")
                    }
                }
                .padding(.horizontal, 40)
            }
            
            Spacer()
            
            // Permission buttons
            VStack(spacing: 16) {
                Button("Autoriser la localisation") {
                    locationManager.requestLocationPermission()
                }
                .buttonStyle(PrimaryButtonStyle())
                
                Button("Plus tard") {
                    viewModel.completeOnboarding()
                }
                .buttonStyle(SecondaryButtonStyle())
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 30)
        }
    }
}

struct LocationBenefitRow: View {
    let text: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.caption)
            
            Text(text)
                .font(.body)
                .foregroundColor(.white.opacity(0.9))
            
            Spacer()
        }
    }
}

// MARK: - Custom Components
struct CustomTextField: View {
    @Binding var text: String
    let placeholder: String
    let icon: String
    var keyboardType: UIKeyboardType = .default
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.white.opacity(0.7))
                .frame(width: 20)
            
            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .foregroundColor(.white)
                .autocapitalization(.none)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.1))
        .cornerRadius(12)
    }
}

struct CustomSecureField: View {
    @Binding var text: String
    let placeholder: String
    let icon: String
    @State private var isSecure = true
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.white.opacity(0.7))
                .frame(width: 20)
            
            if isSecure {
                SecureField(placeholder, text: $text)
                    .foregroundColor(.white)
            } else {
                TextField(placeholder, text: $text)
                    .foregroundColor(.white)
            }
            
            Button(action: { isSecure.toggle() }) {
                Image(systemName: isSecure ? "eye.slash" : "eye")
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .fontWeight(.semibold)
            .foregroundColor(Color("PrimaryColor"))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.white)
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.white.opacity(0.2))
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

#Preview {
    OnboardingView()
        .environmentObject(AppState())
        .environmentObject(AuthenticationManager())
}