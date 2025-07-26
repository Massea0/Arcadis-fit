package com.arcadisfit.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName
import java.util.Date

// MARK: - User Entity
@Entity(tableName = "users")
data class User(
    @PrimaryKey
    val id: String,
    val email: String,
    @SerializedName("phone_number")
    val phoneNumber: String?,
    @SerializedName("phone_verified")
    val phoneVerified: Boolean,
    @SerializedName("full_name")
    val fullName: String,
    @SerializedName("date_of_birth")
    val dateOfBirth: Date?,
    val gender: Gender?,
    @SerializedName("height_cm")
    val heightCm: Int?,
    @SerializedName("height_ft")
    val heightFt: Int?,
    @SerializedName("height_in")
    val heightIn: Int?,
    @SerializedName("weight_kg")
    val weightKg: Double?,
    @SerializedName("weight_lbs")
    val weightLbs: Double?,
    @SerializedName("fitness_level")
    val fitnessLevel: FitnessLevel,
    @SerializedName("fitness_goals")
    val fitnessGoals: List<String>,
    @SerializedName("profile_picture_url")
    val profilePictureUrl: String?,
    @SerializedName("units_preference")
    val unitsPreference: UnitsPreference,
    @SerializedName("language_preference")
    val languagePreference: Language,
    @SerializedName("location_lat")
    val locationLat: Double?,
    @SerializedName("location_lng")
    val locationLng: Double?,
    @SerializedName("privacy_settings")
    val privacySettings: PrivacySettings,
    @SerializedName("onboarding_completed")
    val onboardingCompleted: Boolean,
    @SerializedName("created_at")
    val createdAt: Date,
    @SerializedName("updated_at")
    val updatedAt: Date
) {
    // Computed properties
    val displayName: String
        get() = fullName
    
    val age: Int?
        get() = dateOfBirth?.let { birthDate ->
            val today = Date()
            val diffInMillis = today.time - birthDate.time
            val diffInYears = diffInMillis / (1000L * 60 * 60 * 24 * 365)
            diffInYears.toInt()
        }
    
    val height: Height
        get() = Height(cm = heightCm, ft = heightFt, `in` = heightIn)
    
    val weight: Weight
        get() = Weight(kg = weightKg, lbs = weightLbs)
    
    val isProfileComplete: Boolean
        get() = onboardingCompleted && phoneVerified
}

// MARK: - Gender Enum
enum class Gender(val displayName: String) {
    @SerializedName("male")
    MALE("Homme"),
    
    @SerializedName("female")
    FEMALE("Femme"),
    
    @SerializedName("other")
    OTHER("Autre"),
    
    @SerializedName("prefer_not_to_say")
    PREFER_NOT_TO_SAY("Préfère ne pas dire")
}

// MARK: - Fitness Level Enum
enum class FitnessLevel(val displayName: String, val description: String) {
    @SerializedName("beginner")
    BEGINNER("Débutant", "Vous débutez dans le fitness ou vous n'avez pas fait d'exercice depuis longtemps"),
    
    @SerializedName("intermediate")
    INTERMEDIATE("Intermédiaire", "Vous faites régulièrement de l'exercice et vous connaissez les bases"),
    
    @SerializedName("advanced")
    ADVANCED("Avancé", "Vous êtes expérimenté et vous cherchez des défis plus difficiles")
}

// MARK: - Height Data Class
data class Height(
    val cm: Int?,
    val ft: Int?,
    val `in`: Int?
) {
    val displayString: String
        get() = when {
            cm != null -> "$cm cm"
            ft != null && `in` != null -> "${ft}' ${`in`}\""
            else -> "Non spécifié"
        }
    
    val cmValue: Int?
        get() = when {
            cm != null -> cm
            ft != null && `in` != null -> ((ft * 30.48) + (`in` * 2.54)).toInt()
            else -> null
        }
    
    val ftInValue: Pair<Int, Int>?
        get() = when {
            cm != null -> {
                val totalInches = cm / 2.54
                val feet = (totalInches / 12).toInt()
                val inches = (totalInches % 12).toInt()
                Pair(feet, inches)
            }
            ft != null && `in` != null -> Pair(ft, `in`)
            else -> null
        }
}

// MARK: - Weight Data Class
data class Weight(
    val kg: Double?,
    val lbs: Double?
) {
    val displayString: String
        get() = when {
            kg != null -> "${kg.toInt()} kg"
            lbs != null -> "${lbs.toInt()} lbs"
            else -> "Non spécifié"
        }
    
    val kgValue: Double?
        get() = when {
            kg != null -> kg
            lbs != null -> lbs * 0.453592
            else -> null
        }
    
    val lbsValue: Double?
        get() = when {
            lbs != null -> lbs
            kg != null -> kg * 2.20462
            else -> null
        }
}

// MARK: - Privacy Settings Data Class
data class PrivacySettings(
    @SerializedName("profile_public")
    val profilePublic: Boolean = false,
    @SerializedName("share_workouts")
    val shareWorkouts: Boolean = false,
    @SerializedName("share_nutrition")
    val shareNutrition: Boolean = false
)

// MARK: - Units Preference Enum
enum class UnitsPreference(val displayName: String) {
    @SerializedName("metric")
    METRIC("Métrique (kg, cm)"),
    
    @SerializedName("imperial")
    IMPERIAL("Impérial (lbs, ft)")
}

// MARK: - Language Enum
enum class Language(val displayName: String, val flag: String) {
    @SerializedName("fr")
    FRENCH("Français", "🇫🇷"),
    
    @SerializedName("en")
    ENGLISH("English", "🇺🇸"),
    
    @SerializedName("wo")
    WOLOF("Wolof", "🇸🇳")
}

// MARK: - API Request/Response Models

// User Registration Request
data class UserRegistrationRequest(
    val email: String,
    val password: String,
    @SerializedName("fullName")
    val fullName: String,
    @SerializedName("phoneNumber")
    val phoneNumber: String,
    @SerializedName("dateOfBirth")
    val dateOfBirth: String?,
    val gender: Gender?,
    @SerializedName("fitnessLevel")
    val fitnessLevel: FitnessLevel?,
    @SerializedName("fitnessGoals")
    val fitnessGoals: List<String>?
)

// User Login Request
data class UserLoginRequest(
    val email: String,
    val password: String,
    @SerializedName("rememberMe")
    val rememberMe: Boolean?
)

// User Login Response
data class UserLoginResponse(
    val success: Boolean,
    val message: String,
    val data: LoginData
)

data class LoginData(
    val token: String,
    val user: UserResponse
)

data class UserResponse(
    val id: String,
    val email: String,
    @SerializedName("fullName")
    val fullName: String,
    @SerializedName("phoneVerified")
    val phoneVerified: Boolean,
    @SerializedName("onboardingCompleted")
    val onboardingCompleted: Boolean,
    @SerializedName("profilePicture")
    val profilePicture: String?
)

// Phone Verification Request
data class PhoneVerificationRequest(
    @SerializedName("phoneNumber")
    val phoneNumber: String,
    val code: String
)

// Onboarding Request
data class OnboardingRequest(
    val height: HeightRequest,
    val weight: WeightRequest,
    @SerializedName("fitnessGoals")
    val fitnessGoals: List<String>,
    val location: LocationRequest?
)

data class HeightRequest(
    val cm: Int?,
    val ft: Int?,
    val `in`: Int?
)

data class WeightRequest(
    val kg: Double?,
    val lbs: Double?
)

data class LocationRequest(
    val lat: Double,
    val lng: Double
)

// User Update Request
data class UserUpdateRequest(
    @SerializedName("fullName")
    val fullName: String?,
    @SerializedName("dateOfBirth")
    val dateOfBirth: String?,
    val gender: Gender?,
    @SerializedName("heightCm")
    val heightCm: Int?,
    @SerializedName("heightFt")
    val heightFt: Int?,
    @SerializedName("heightIn")
    val heightIn: Int?,
    @SerializedName("weightKg")
    val weightKg: Double?,
    @SerializedName("weightLbs")
    val weightLbs: Double?,
    @SerializedName("fitnessLevel")
    val fitnessLevel: FitnessLevel?,
    @SerializedName("fitnessGoals")
    val fitnessGoals: List<String>?,
    @SerializedName("unitsPreference")
    val unitsPreference: UnitsPreference?,
    @SerializedName("languagePreference")
    val languagePreference: Language?,
    @SerializedName("privacySettings")
    val privacySettings: PrivacySettings?
)

// MARK: - API Response Wrapper
data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T?,
    val code: String?
)

// MARK: - Constants
object UserConstants {
    const val MIN_PASSWORD_LENGTH = 8
    const val MAX_PASSWORD_LENGTH = 128
    const val PHONE_NUMBER_PATTERN = "^\\+221[0-9]{9}$"
    const val DEFAULT_CURRENCY = "XOF"
    const val DEFAULT_COUNTRY = "Senegal"
    const val DEFAULT_PHONE_CODE = "+221"
}