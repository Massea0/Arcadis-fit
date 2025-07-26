import SwiftUI
import Combine
import CoreData

@main
struct ArcadisFitApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var locationManager = LocationManager()
    @StateObject private var notificationManager = NotificationManager()
    
    let persistenceController = PersistenceController.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(authManager)
                .environmentObject(locationManager)
                .environmentObject(notificationManager)
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .preferredColorScheme(.light) // Force light mode for consistent design
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        // Configure app appearance
        configureAppearance()
        
        // Request notification permissions
        notificationManager.requestPermissions()
        
        // Setup location services
        locationManager.requestLocationPermission()
        
        // Check authentication status
        authManager.checkAuthenticationStatus()
    }
    
    private func configureAppearance() {
        // Configure navigation bar appearance
        let navigationBarAppearance = UINavigationBarAppearance()
        navigationBarAppearance.configureWithOpaqueBackground()
        navigationBarAppearance.backgroundColor = UIColor(Color("PrimaryColor"))
        navigationBarAppearance.titleTextAttributes = [
            .foregroundColor: UIColor.white,
            .font: UIFont.systemFont(ofSize: 18, weight: .semibold)
        ]
        navigationBarAppearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor.white,
            .font: UIFont.systemFont(ofSize: 34, weight: .bold)
        ]
        
        UINavigationBar.appearance().standardAppearance = navigationBarAppearance
        UINavigationBar.appearance().compactAppearance = navigationBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navigationBarAppearance
        
        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = UIColor.systemBackground
        
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
        
        // Configure button appearance
        let buttonAppearance = UIButton.appearance()
        buttonAppearance.tintColor = UIColor(Color("PrimaryColor"))
    }
}

// MARK: - App State Management
class AppState: ObservableObject {
    @Published var currentUser: User?
    @Published var isOnboardingCompleted = false
    @Published var selectedLanguage: Language = .french
    @Published var unitsPreference: UnitsPreference = .metric
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadUserPreferences()
    }
    
    func loadUserPreferences() {
        // Load language preference
        if let languageString = UserDefaults.standard.string(forKey: "selectedLanguage"),
           let language = Language(rawValue: languageString) {
            selectedLanguage = language
        }
        
        // Load units preference
        if let unitsString = UserDefaults.standard.string(forKey: "unitsPreference"),
           let units = UnitsPreference(rawValue: unitsString) {
            unitsPreference = units
        }
    }
    
    func updateLanguage(_ language: Language) {
        selectedLanguage = language
        UserDefaults.standard.set(language.rawValue, forKey: "selectedLanguage")
        
        // Update app locale
        Bundle.setLanguage(language.rawValue)
    }
    
    func updateUnitsPreference(_ units: UnitsPreference) {
        unitsPreference = units
        UserDefaults.standard.set(units.rawValue, forKey: "unitsPreference")
    }
    
    func showError(_ message: String) {
        errorMessage = message
        showError = true
    }
    
    func clearError() {
        errorMessage = nil
        showError = false
    }
}

// MARK: - Language Support
enum Language: String, CaseIterable {
    case french = "fr"
    case english = "en"
    case wolof = "wo"
    
    var displayName: String {
        switch self {
        case .french:
            return "Français"
        case .english:
            return "English"
        case .wolof:
            return "Wolof"
        }
    }
    
    var flag: String {
        switch self {
        case .french:
            return "🇫🇷"
        case .english:
            return "🇺🇸"
        case .wolof:
            return "🇸🇳"
        }
    }
}

// MARK: - Units Preference
enum UnitsPreference: String, CaseIterable {
    case metric = "metric"
    case imperial = "imperial"
    
    var displayName: String {
        switch self {
        case .metric:
            return "Métrique (kg, cm)"
        case .imperial:
            return "Impérial (lbs, ft)"
        }
    }
}

// MARK: - Bundle Extension for Language Support
extension Bundle {
    private static var bundle: Bundle!
    
    public static func localizedBundle() -> Bundle! {
        if bundle == nil {
            bundle = Bundle.main
        }
        return bundle
    }
    
    public static func setLanguage(_ language: String) {
        defer {
            object_setClass(Bundle.main, AnyClass(self))
        }
        
        guard let path = Bundle.main.path(forResource: language, ofType: "lproj") else {
            bundle = Bundle.main
            return
        }
        
        bundle = Bundle(path: path)
    }
}

// MARK: - String Extension for Localization
extension String {
    var localized: String {
        return NSLocalizedString(self, bundle: Bundle.localizedBundle(), comment: "")
    }
    
    func localized(with arguments: CVarArg...) -> String {
        return String(format: self.localized, arguments: arguments)
    }
}

// MARK: - Color Extensions
extension Color {
    static let primaryColor = Color("PrimaryColor")
    static let secondaryColor = Color("SecondaryColor")
    static let accentColor = Color("AccentColor")
    static let backgroundColor = Color("BackgroundColor")
    static let surfaceColor = Color("SurfaceColor")
    static let textPrimary = Color("TextPrimary")
    static let textSecondary = Color("TextSecondary")
    static let successColor = Color("SuccessColor")
    static let warningColor = Color("WarningColor")
    static let errorColor = Color("ErrorColor")
}

// MARK: - Constants
struct Constants {
    static let appName = "Arcadis Fit"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    
    // API Configuration
    static let baseURL = "https://api.arcadis-fit.com"
    static let apiVersion = "v1"
    
    // Default values
    static let defaultCurrency = "XOF"
    static let defaultCountry = "Senegal"
    static let defaultPhoneCode = "+221"
    
    // Validation
    static let minPasswordLength = 8
    static let maxPasswordLength = 128
    static let phoneNumberPattern = "^\\+221[0-9]{9}$"
    
    // UI Constants
    static let cornerRadius: CGFloat = 12
    static let buttonHeight: CGFloat = 50
    static let textFieldHeight: CGFloat = 50
    static let spacing: CGFloat = 16
    static let smallSpacing: CGFloat = 8
    static let largeSpacing: CGFloat = 24
    
    // Animation
    static let animationDuration: Double = 0.3
    static let slowAnimationDuration: Double = 0.5
    
    // Cache
    static let cacheExpirationTime: TimeInterval = 3600 // 1 hour
    
    // Notifications
    static let workoutReminderTime = Calendar.current.date(from: DateComponents(hour: 8, minute: 0)) ?? Date()
    static let nutritionReminderTime = Calendar.current.date(from: DateComponents(hour: 12, minute: 0)) ?? Date()
}

// MARK: - Utility Functions
func formatCurrency(_ amount: Double, currency: String = Constants.defaultCurrency) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = currency
    formatter.minimumFractionDigits = 0
    formatter.maximumFractionDigits = 0
    
    return formatter.string(from: NSNumber(value: amount)) ?? "\(amount) \(currency)"
}

func formatPhoneNumber(_ phoneNumber: String) -> String {
    // Format Senegalese phone number: +221 77 123 45 67
    let cleaned = phoneNumber.replacingOccurrences(of: "[^0-9+]", with: "", options: .regularExpression)
    
    if cleaned.hasPrefix("+221") {
        let number = String(cleaned.dropFirst(4))
        if number.count == 9 {
            let index = number.index(number.startIndex, offsetBy: 2)
            let firstPart = String(number[..<index])
            let secondPart = String(number[index..<number.index(index, offsetBy: 3)])
            let thirdPart = String(number[number.index(index, offsetBy: 3)..<number.index(index, offsetBy: 5)])
            let fourthPart = String(number[number.index(index, offsetBy: 5)...])
            
            return "+221 \(firstPart) \(secondPart) \(thirdPart) \(fourthPart)"
        }
    }
    
    return phoneNumber
}

func validateEmail(_ email: String) -> Bool {
    let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
    let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
    return emailPredicate.evaluate(with: email)
}

func validatePhoneNumber(_ phoneNumber: String) -> Bool {
    let phoneRegex = Constants.phoneNumberPattern
    let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
    return phonePredicate.evaluate(with: phoneNumber)
}

// MARK: - Date Extensions
extension Date {
    func formattedString(format: String = "dd/MM/yyyy") -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = format
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: self)
    }
    
    func timeAgoString() -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.localizedString(for: self, relativeTo: Date())
    }
    
    var isToday: Bool {
        return Calendar.current.isDateInToday(self)
    }
    
    var isYesterday: Bool {
        return Calendar.current.isDateInYesterday(self)
    }
    
    var isThisWeek: Bool {
        return Calendar.current.isDate(self, equalTo: Date(), toGranularity: .weekOfYear)
    }
}

// MARK: - View Extensions
extension View {
    func primaryButtonStyle() -> some View {
        self
            .frame(maxWidth: .infinity)
            .frame(height: Constants.buttonHeight)
            .background(Color.primaryColor)
            .foregroundColor(.white)
            .cornerRadius(Constants.cornerRadius)
            .font(.system(size: 16, weight: .semibold))
    }
    
    func secondaryButtonStyle() -> some View {
        self
            .frame(maxWidth: .infinity)
            .frame(height: Constants.buttonHeight)
            .background(Color.clear)
            .foregroundColor(Color.primaryColor)
            .overlay(
                RoundedRectangle(cornerRadius: Constants.cornerRadius)
                    .stroke(Color.primaryColor, lineWidth: 2)
            )
            .font(.system(size: 16, weight: .semibold))
    }
    
    func cardStyle() -> some View {
        self
            .background(Color.surfaceColor)
            .cornerRadius(Constants.cornerRadius)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
    
    func errorAlert(error: Binding<String?>, isPresented: Binding<Bool>) -> some View {
        self.alert("Erreur", isPresented: isPresented) {
            Button("OK") {
                error.wrappedValue = nil
            }
        } message: {
            Text(error.wrappedValue ?? "Une erreur s'est produite")
        }
    }
    
    func loadingOverlay(_ isLoading: Bool) -> some View {
        self.overlay(
            Group {
                if isLoading {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                    
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.5)
                }
            }
        )
    }
}