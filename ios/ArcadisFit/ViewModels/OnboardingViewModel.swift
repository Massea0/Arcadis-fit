import SwiftUI
import Combine

class OnboardingViewModel: ObservableObject {
    @Published var currentStep = 1
    @Published var onboardingCompleted = false
    
    // Registration fields
    @Published var fullName = ""
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var phoneNumber = "+221"
    
    // Phone verification
    @Published var verificationCode = ""
    @Published var resendCodeDisabled = false
    @Published var resendCodeCountdown = 60
    
    // Profile setup
    @Published var dateOfBirth = Date()
    @Published var gender: Gender?
    @Published var heightCm = ""
    @Published var weightKg = ""
    
    // Fitness goals
    @Published var fitnessGoals: [String] = []
    
    // Error handling
    @Published var showError = false
    @Published var errorMessage = ""
    
    // Services
    private let authService = AuthenticationService()
    private var cancellables = Set<AnyCancellable>()
    private var resendTimer: Timer?
    
    // Validation computed properties
    var canProceed: Bool {
        switch currentStep {
        case 1: // Welcome screen
            return true
        case 2: // Registration
            return isRegistrationValid
        case 3: // Phone verification
            return verificationCode.count == 6
        case 4: // Profile setup
            return isProfileValid
        case 5: // Fitness goals
            return !fitnessGoals.isEmpty
        case 6: // Location permission
            return true
        default:
            return false
        }
    }
    
    private var isRegistrationValid: Bool {
        !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        isValidEmail(email) &&
        password.count >= 8 &&
        password == confirmPassword &&
        isValidPhoneNumber(phoneNumber)
    }
    
    private var isProfileValid: Bool {
        gender != nil &&
        !heightCm.isEmpty &&
        !weightKg.isEmpty &&
        Double(heightCm) != nil &&
        Double(weightKg) != nil
    }
    
    init() {
        setupDateOfBirth()
    }
    
    private func setupDateOfBirth() {
        // Set default date to 25 years ago
        let calendar = Calendar.current
        if let defaultDate = calendar.date(byAdding: .year, value: -25, to: Date()) {
            dateOfBirth = defaultDate
        }
    }
    
    func handleNextStep() {
        switch currentStep {
        case 1:
            currentStep = 2
        case 2:
            registerUser()
        case 3:
            verifyPhone()
        case 4:
            currentStep = 5
        case 5:
            currentStep = 6
        case 6:
            completeOnboarding()
        default:
            break
        }
    }
    
    private func registerUser() {
        guard isRegistrationValid else {
            showError(message: "Veuillez corriger les erreurs dans le formulaire")
            return
        }
        
        let request = UserRegistrationRequest(
            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
            password: password,
            fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
            phoneNumber: phoneNumber,
            dateOfBirth: formatDate(dateOfBirth),
            gender: gender,
            fitnessLevel: nil,
            fitnessGoals: nil
        )
        
        authService.register(request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.showError(message: error.localizedDescription)
                    }
                },
                receiveValue: { [weak self] response in
                    if response.success {
                        self?.currentStep = 3
                        self?.sendVerificationCode()
                    } else {
                        self?.showError(message: response.message)
                    }
                }
            )
            .store(in: &cancellables)
    }
    
    private func sendVerificationCode() {
        let request = PhoneVerificationRequest(
            phoneNumber: phoneNumber,
            code: "" // Empty for sending code
        )
        
        authService.sendVerificationCode(request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.showError(message: error.localizedDescription)
                    }
                },
                receiveValue: { [weak self] response in
                    if response.success {
                        self?.startResendTimer()
                    } else {
                        self?.showError(message: response.message)
                    }
                }
            )
            .store(in: &cancellables)
    }
    
    private func verifyPhone() {
        guard verificationCode.count == 6 else {
            showError(message: "Veuillez entrer le code de vérification à 6 chiffres")
            return
        }
        
        let request = PhoneVerificationRequest(
            phoneNumber: phoneNumber,
            code: verificationCode
        )
        
        authService.verifyPhone(request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.showError(message: error.localizedDescription)
                    }
                },
                receiveValue: { [weak self] response in
                    if response.success {
                        self?.currentStep = 4
                    } else {
                        self?.showError(message: response.message)
                    }
                }
            )
            .store(in: &cancellables)
    }
    
    func resendVerificationCode() {
        guard !resendCodeDisabled else { return }
        
        sendVerificationCode()
    }
    
    private func startResendTimer() {
        resendCodeDisabled = true
        resendCodeCountdown = 60
        
        resendTimer?.invalidate()
        resendTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            guard let self = self else {
                timer.invalidate()
                return
            }
            
            if self.resendCodeCountdown > 0 {
                self.resendCodeCountdown -= 1
            } else {
                self.resendCodeDisabled = false
                timer.invalidate()
            }
        }
    }
    
    private func completeOnboarding() {
        let onboardingRequest = OnboardingRequest(
            height: HeightRequest(
                cm: Int(heightCm),
                ft: nil,
                `in`: nil
            ),
            weight: WeightRequest(
                kg: Double(weightKg),
                lbs: nil
            ),
            fitnessGoals: fitnessGoals,
            location: nil // Will be set by location manager
        )
        
        authService.completeOnboarding(request: onboardingRequest)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.showError(message: error.localizedDescription)
                    }
                },
                receiveValue: { [weak self] response in
                    if response.success {
                        self?.onboardingCompleted = true
                    } else {
                        self?.showError(message: response.message)
                    }
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Validation Helpers
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    private func isValidPhoneNumber(_ phone: String) -> Bool {
        // Senegalese phone number validation
        let phoneRegex = "^\\+221[0-9]{9}$"
        let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
        return phonePredicate.evaluate(with: phone)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private func showError(message: String) {
        errorMessage = message
        showError = true
    }
    
    deinit {
        resendTimer?.invalidate()
    }
}

// MARK: - Authentication Service
class AuthenticationService {
    private let baseURL = "http://localhost:3000/api"
    private let session = URLSession.shared
    
    func register(request: UserRegistrationRequest) -> AnyPublisher<ApiResponse<UserLoginResponse>, Error> {
        guard let url = URL(string: "\(baseURL)/auth/register") else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        
        return session.dataTaskPublisher(for: urlRequest)
            .map(\.data)
            .decode(type: ApiResponse<UserLoginResponse>.self, decoder: JSONDecoder())
            .mapError { error in
                if let decodingError = error as? DecodingError {
                    return URLError(.cannotDecodeContentData)
                }
                return error
            }
            .eraseToAnyPublisher()
    }
    
    func sendVerificationCode(request: PhoneVerificationRequest) -> AnyPublisher<ApiResponse<EmptyResponse>, Error> {
        guard let url = URL(string: "\(baseURL)/auth/send-verification-code") else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        
        return session.dataTaskPublisher(for: urlRequest)
            .map(\.data)
            .decode(type: ApiResponse<EmptyResponse>.self, decoder: JSONDecoder())
            .mapError { error in
                if let decodingError = error as? DecodingError {
                    return URLError(.cannotDecodeContentData)
                }
                return error
            }
            .eraseToAnyPublisher()
    }
    
    func verifyPhone(request: PhoneVerificationRequest) -> AnyPublisher<ApiResponse<EmptyResponse>, Error> {
        guard let url = URL(string: "\(baseURL)/auth/verify-phone") else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        
        return session.dataTaskPublisher(for: urlRequest)
            .map(\.data)
            .decode(type: ApiResponse<EmptyResponse>.self, decoder: JSONDecoder())
            .mapError { error in
                if let decodingError = error as? DecodingError {
                    return URLError(.cannotDecodeContentData)
                }
                return error
            }
            .eraseToAnyPublisher()
    }
    
    func completeOnboarding(request: OnboardingRequest) -> AnyPublisher<ApiResponse<EmptyResponse>, Error> {
        guard let url = URL(string: "\(baseURL)/auth/complete-onboarding") else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header if user is logged in
        if let token = UserDefaults.standard.string(forKey: "authToken") {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        
        return session.dataTaskPublisher(for: urlRequest)
            .map(\.data)
            .decode(type: ApiResponse<EmptyResponse>.self, decoder: JSONDecoder())
            .mapError { error in
                if let decodingError = error as? DecodingError {
                    return URLError(.cannotDecodeContentData)
                }
                return error
            }
            .eraseToAnyPublisher()
    }
}

// MARK: - Response Models
struct EmptyResponse: Codable {}

struct ApiResponse<T: Codable>: Codable {
    let success: Bool
    let message: String
    let data: T?
    let code: String?
}