import Foundation
import Combine

// MARK: - User Model
struct User: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    let phoneNumber: String?
    let phoneVerified: Bool
    let fullName: String
    let dateOfBirth: Date?
    let gender: Gender?
    let heightCm: Int?
    let heightFt: Int?
    let heightIn: Int?
    let weightKg: Double?
    let weightLbs: Double?
    let fitnessLevel: FitnessLevel
    let fitnessGoals: [String]
    let profilePictureUrl: String?
    let unitsPreference: UnitsPreference
    let languagePreference: Language
    let locationLat: Double?
    let locationLng: Double?
    let privacySettings: PrivacySettings
    let onboardingCompleted: Bool
    let createdAt: Date
    let updatedAt: Date
    
    // Computed properties
    var displayName: String {
        return fullName
    }
    
    var age: Int? {
        guard let dateOfBirth = dateOfBirth else { return nil }
        return Calendar.current.dateComponents([.year], from: dateOfBirth, to: Date()).year
    }
    
    var height: Height {
        return Height(cm: heightCm, ft: heightFt, in: heightIn)
    }
    
    var weight: Weight {
        return Weight(kg: weightKg, lbs: weightLbs)
    }
    
    var isProfileComplete: Bool {
        return onboardingCompleted && phoneVerified
    }
    
    // MARK: - Coding Keys
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case phoneNumber = "phone_number"
        case phoneVerified = "phone_verified"
        case fullName = "full_name"
        case dateOfBirth = "date_of_birth"
        case gender
        case heightCm = "height_cm"
        case heightFt = "height_ft"
        case heightIn = "height_in"
        case weightKg = "weight_kg"
        case weightLbs = "weight_lbs"
        case fitnessLevel = "fitness_level"
        case fitnessGoals = "fitness_goals"
        case profilePictureUrl = "profile_picture_url"
        case unitsPreference = "units_preference"
        case languagePreference = "language_preference"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case privacySettings = "privacy_settings"
        case onboardingCompleted = "onboarding_completed"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
    
    // MARK: - Initializers
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(String.self, forKey: .id)
        email = try container.decode(String.self, forKey: .email)
        phoneNumber = try container.decodeIfPresent(String.self, forKey: .phoneNumber)
        phoneVerified = try container.decode(Bool.self, forKey: .phoneVerified)
        fullName = try container.decode(String.self, forKey: .fullName)
        
        // Decode date of birth
        if let dateString = try container.decodeIfPresent(String.self, forKey: .dateOfBirth) {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            dateOfBirth = formatter.date(from: dateString)
        } else {
            dateOfBirth = nil
        }
        
        gender = try container.decodeIfPresent(Gender.self, forKey: .gender)
        heightCm = try container.decodeIfPresent(Int.self, forKey: .heightCm)
        heightFt = try container.decodeIfPresent(Int.self, forKey: .heightFt)
        heightIn = try container.decodeIfPresent(Int.self, forKey: .heightIn)
        weightKg = try container.decodeIfPresent(Double.self, forKey: .weightKg)
        weightLbs = try container.decodeIfPresent(Double.self, forKey: .weightLbs)
        fitnessLevel = try container.decode(FitnessLevel.self, forKey: .fitnessLevel)
        fitnessGoals = try container.decode([String].self, forKey: .fitnessGoals)
        profilePictureUrl = try container.decodeIfPresent(String.self, forKey: .profilePictureUrl)
        unitsPreference = try container.decode(UnitsPreference.self, forKey: .unitsPreference)
        languagePreference = try container.decode(Language.self, forKey: .languagePreference)
        locationLat = try container.decodeIfPresent(Double.self, forKey: .locationLat)
        locationLng = try container.decodeIfPresent(Double.self, forKey: .locationLng)
        privacySettings = try container.decode(PrivacySettings.self, forKey: .privacySettings)
        onboardingCompleted = try container.decode(Bool.self, forKey: .onboardingCompleted)
        
        // Decode dates
        let dateFormatter = ISO8601DateFormatter()
        if let createdAtString = try container.decodeIfPresent(String.self, forKey: .createdAt) {
            createdAt = dateFormatter.date(from: createdAtString) ?? Date()
        } else {
            createdAt = Date()
        }
        
        if let updatedAtString = try container.decodeIfPresent(String.self, forKey: .updatedAt) {
            updatedAt = dateFormatter.date(from: updatedAtString) ?? Date()
        } else {
            updatedAt = Date()
        }
    }
    
    // MARK: - Custom Initializer
    init(
        id: String,
        email: String,
        phoneNumber: String? = nil,
        phoneVerified: Bool = false,
        fullName: String,
        dateOfBirth: Date? = nil,
        gender: Gender? = nil,
        heightCm: Int? = nil,
        heightFt: Int? = nil,
        heightIn: Int? = nil,
        weightKg: Double? = nil,
        weightLbs: Double? = nil,
        fitnessLevel: FitnessLevel = .beginner,
        fitnessGoals: [String] = [],
        profilePictureUrl: String? = nil,
        unitsPreference: UnitsPreference = .metric,
        languagePreference: Language = .french,
        locationLat: Double? = nil,
        locationLng: Double? = nil,
        privacySettings: PrivacySettings = PrivacySettings(),
        onboardingCompleted: Bool = false
    ) {
        self.id = id
        self.email = email
        self.phoneNumber = phoneNumber
        self.phoneVerified = phoneVerified
        self.fullName = fullName
        self.dateOfBirth = dateOfBirth
        self.gender = gender
        self.heightCm = heightCm
        self.heightFt = heightFt
        self.heightIn = heightIn
        self.weightKg = weightKg
        self.weightLbs = weightLbs
        self.fitnessLevel = fitnessLevel
        self.fitnessGoals = fitnessGoals
        self.profilePictureUrl = profilePictureUrl
        self.unitsPreference = unitsPreference
        self.languagePreference = languagePreference
        self.locationLat = locationLat
        self.locationLng = locationLng
        self.privacySettings = privacySettings
        self.onboardingCompleted = onboardingCompleted
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

// MARK: - Gender Enum
enum Gender: String, CaseIterable, Codable {
    case male = "male"
    case female = "female"
    case other = "other"
    case preferNotToSay = "prefer_not_to_say"
    
    var displayName: String {
        switch self {
        case .male:
            return "Homme"
        case .female:
            return "Femme"
        case .other:
            return "Autre"
        case .preferNotToSay:
            return "Préfère ne pas dire"
        }
    }
}

// MARK: - Fitness Level Enum
enum FitnessLevel: String, CaseIterable, Codable {
    case beginner = "beginner"
    case intermediate = "intermediate"
    case advanced = "advanced"
    
    var displayName: String {
        switch self {
        case .beginner:
            return "Débutant"
        case .intermediate:
            return "Intermédiaire"
        case .advanced:
            return "Avancé"
        }
    }
    
    var description: String {
        switch self {
        case .beginner:
            return "Vous débutez dans le fitness ou vous n'avez pas fait d'exercice depuis longtemps"
        case .intermediate:
            return "Vous faites régulièrement de l'exercice et vous connaissez les bases"
        case .advanced:
            return "Vous êtes expérimenté et vous cherchez des défis plus difficiles"
        }
    }
}

// MARK: - Height Struct
struct Height: Codable, Equatable {
    let cm: Int?
    let ft: Int?
    let `in`: Int?
    
    var displayString: String {
        if let cm = cm {
            return "\(cm) cm"
        } else if let ft = ft, let inches = `in` {
            return "\(ft)' \(inches)\""
        }
        return "Non spécifié"
    }
    
    var cmValue: Int? {
        if let cm = cm {
            return cm
        } else if let ft = ft, let inches = `in` {
            return (ft * 30.48 + Double(inches) * 2.54).rounded()
        }
        return nil
    }
    
    var ftInValue: (ft: Int, inches: Int)? {
        if let cm = cm {
            let totalInches = cm / 2.54
            let feet = Int(totalInches / 12)
            let inches = Int(totalInches.truncatingRemainder(dividingBy: 12))
            return (feet, inches)
        } else if let ft = ft, let inches = `in` {
            return (ft, inches)
        }
        return nil
    }
}

// MARK: - Weight Struct
struct Weight: Codable, Equatable {
    let kg: Double?
    let lbs: Double?
    
    var displayString: String {
        if let kg = kg {
            return "\(Int(kg)) kg"
        } else if let lbs = lbs {
            return "\(Int(lbs)) lbs"
        }
        return "Non spécifié"
    }
    
    var kgValue: Double? {
        if let kg = kg {
            return kg
        } else if let lbs = lbs {
            return lbs * 0.453592
        }
        return nil
    }
    
    var lbsValue: Double? {
        if let lbs = lbs {
            return lbs
        } else if let kg = kg {
            return kg * 2.20462
        }
        return nil
    }
}

// MARK: - Privacy Settings
struct PrivacySettings: Codable, Equatable {
    let profilePublic: Bool
    let shareWorkouts: Bool
    let shareNutrition: Bool
    
    init(profilePublic: Bool = false, shareWorkouts: Bool = false, shareNutrition: Bool = false) {
        self.profilePublic = profilePublic
        self.shareWorkouts = shareWorkouts
        self.shareNutrition = shareNutrition
    }
    
    enum CodingKeys: String, CodingKey {
        case profilePublic = "profile_public"
        case shareWorkouts = "share_workouts"
        case shareNutrition = "share_nutrition"
    }
}

// MARK: - User Registration Request
struct UserRegistrationRequest: Codable {
    let email: String
    let password: String
    let fullName: String
    let phoneNumber: String
    let dateOfBirth: String?
    let gender: Gender?
    let fitnessLevel: FitnessLevel?
    let fitnessGoals: [String]?
    
    enum CodingKeys: String, CodingKey {
        case email, password
        case fullName = "fullName"
        case phoneNumber = "phoneNumber"
        case dateOfBirth = "dateOfBirth"
        case gender, fitnessLevel, fitnessGoals
    }
}

// MARK: - User Login Request
struct UserLoginRequest: Codable {
    let email: String
    let password: String
    let rememberMe: Bool?
    
    enum CodingKeys: String, CodingKey {
        case email, password
        case rememberMe = "rememberMe"
    }
}

// MARK: - User Login Response
struct UserLoginResponse: Codable {
    let success: Bool
    let message: String
    let data: LoginData
}

struct LoginData: Codable {
    let token: String
    let user: UserResponse
}

struct UserResponse: Codable {
    let id: String
    let email: String
    let fullName: String
    let phoneVerified: Bool
    let onboardingCompleted: Bool
    let profilePicture: String?
    
    enum CodingKeys: String, CodingKey {
        case id, email
        case fullName = "fullName"
        case phoneVerified = "phoneVerified"
        case onboardingCompleted = "onboardingCompleted"
        case profilePicture = "profilePicture"
    }
}

// MARK: - Phone Verification Request
struct PhoneVerificationRequest: Codable {
    let phoneNumber: String
    let code: String
    
    enum CodingKeys: String, CodingKey {
        case phoneNumber = "phoneNumber"
        case code
    }
}

// MARK: - Onboarding Request
struct OnboardingRequest: Codable {
    let height: HeightRequest
    let weight: WeightRequest
    let fitnessGoals: [String]
    let location: LocationRequest?
    
    struct HeightRequest: Codable {
        let cm: Int?
        let ft: Int?
        let `in`: Int?
    }
    
    struct WeightRequest: Codable {
        let kg: Double?
        let lbs: Double?
    }
    
    struct LocationRequest: Codable {
        let lat: Double
        let lng: Double
    }
}

// MARK: - User Update Request
struct UserUpdateRequest: Codable {
    let fullName: String?
    let dateOfBirth: String?
    let gender: Gender?
    let heightCm: Int?
    let heightFt: Int?
    let heightIn: Int?
    let weightKg: Double?
    let weightLbs: Double?
    let fitnessLevel: FitnessLevel?
    let fitnessGoals: [String]?
    let unitsPreference: UnitsPreference?
    let languagePreference: Language?
    let privacySettings: PrivacySettings?
    
    enum CodingKeys: String, CodingKey {
        case fullName = "fullName"
        case dateOfBirth = "dateOfBirth"
        case gender
        case heightCm = "heightCm"
        case heightFt = "heightFt"
        case heightIn = "heightIn"
        case weightKg = "weightKg"
        case weightLbs = "weightLbs"
        case fitnessLevel = "fitnessLevel"
        case fitnessGoals = "fitnessGoals"
        case unitsPreference = "unitsPreference"
        case languagePreference = "languagePreference"
        case privacySettings = "privacySettings"
    }
}