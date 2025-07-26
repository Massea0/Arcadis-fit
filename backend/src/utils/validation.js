/**
 * Validation utilities for Arcadis Fit application
 */

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validate Senegalese phone number
 */
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Senegalese mobile patterns
  const patterns = [
    /^\+221[76][0-9]{7}$/, // International format: +221 + mobile prefix (7x or 6x) + 7 digits
    /^221[76][0-9]{7}$/,   // Without + sign
    /^[76][0-9]{7}$/,      // Local format: mobile prefix + 7 digits
    /^0[76][0-9]{7}$/      // With leading 0
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Mot de passe requis']
    };
  }
  
  const errors = [];
  
  // Minimum length
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  // Maximum length
  if (password.length > 128) {
    errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }
  
  // At least one digit
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate full name
 */
const validateFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return false;
  }
  
  const trimmed = fullName.trim();
  
  // Must be at least 2 characters and contain at least one space (first name + last name)
  return trimmed.length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
};

/**
 * Validate age (from date of birth)
 */
const validateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return {
      isValid: false,
      error: 'Date de naissance requise'
    };
  }
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      error: 'Date de naissance invalide'
    };
  }
  
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;
  
  if (actualAge < 13) {
    return {
      isValid: false,
      error: 'Vous devez avoir au moins 13 ans'
    };
  }
  
  if (actualAge > 120) {
    return {
      isValid: false,
      error: 'Âge invalide'
    };
  }
  
  return {
    isValid: true,
    age: actualAge
  };
};

/**
 * Validate height (metric)
 */
const validateHeightMetric = (heightCm) => {
  if (!heightCm || isNaN(heightCm)) {
    return false;
  }
  
  const height = parseFloat(heightCm);
  return height >= 100 && height <= 250; // 1m to 2.5m
};

/**
 * Validate height (imperial)
 */
const validateHeightImperial = (heightFt, heightIn) => {
  if (!heightFt || isNaN(heightFt)) {
    return false;
  }
  
  const feet = parseInt(heightFt);
  const inches = heightIn ? parseInt(heightIn) : 0;
  
  if (feet < 3 || feet > 8) {
    return false;
  }
  
  if (inches < 0 || inches >= 12) {
    return false;
  }
  
  const totalInches = feet * 12 + inches;
  return totalInches >= 36 && totalInches <= 96; // 3ft to 8ft
};

/**
 * Validate weight (metric)
 */
const validateWeightMetric = (weightKg) => {
  if (!weightKg || isNaN(weightKg)) {
    return false;
  }
  
  const weight = parseFloat(weightKg);
  return weight >= 30 && weight <= 300; // 30kg to 300kg
};

/**
 * Validate weight (imperial)
 */
const validateWeightImperial = (weightLbs) => {
  if (!weightLbs || isNaN(weightLbs)) {
    return false;
  }
  
  const weight = parseFloat(weightLbs);
  return weight >= 66 && weight <= 660; // 66lbs to 660lbs (30kg to 300kg)
};

/**
 * Validate fitness level
 */
const validateFitnessLevel = (level) => {
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  return validLevels.includes(level);
};

/**
 * Validate fitness goals
 */
const validateFitnessGoals = (goals) => {
  if (!Array.isArray(goals) || goals.length === 0) {
    return false;
  }
  
  const validGoals = [
    'weight_loss',
    'muscle_gain',
    'endurance',
    'strength',
    'flexibility',
    'general_fitness',
    'sports_performance',
    'rehabilitation'
  ];
  
  return goals.every(goal => validGoals.includes(goal)) && goals.length <= 3;
};

/**
 * Validate gender
 */
const validateGender = (gender) => {
  const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
  return validGenders.includes(gender);
};

/**
 * Validate language preference
 */
const validateLanguage = (language) => {
  const validLanguages = ['fr', 'en', 'wo'];
  return validLanguages.includes(language);
};

/**
 * Validate units preference
 */
const validateUnitsPreference = (units) => {
  const validUnits = ['metric', 'imperial'];
  return validUnits.includes(units);
};

/**
 * Validate latitude and longitude
 */
const validateCoordinates = (lat, lng) => {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  // Senegal coordinates range (approximately)
  // Latitude: 12.3 to 16.7
  // Longitude: -17.5 to -11.3
  return latitude >= 12.0 && latitude <= 17.0 && 
         longitude >= -18.0 && longitude <= -11.0;
};

/**
 * Validate SMS verification code
 */
const validateVerificationCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // 6-digit numeric code
  return /^\d{6}$/.test(code);
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, ''); // Remove quotes to prevent injection
};

/**
 * Validate UUID format
 */
const validateUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Comprehensive user profile validation
 */
const validateUserProfile = (profile) => {
  const errors = [];
  
  // Required fields
  if (!profile.fullName || !validateFullName(profile.fullName)) {
    errors.push('Nom complet invalide');
  }
  
  if (!profile.email || !validateEmail(profile.email)) {
    errors.push('Adresse email invalide');
  }
  
  if (!profile.phoneNumber || !validatePhoneNumber(profile.phoneNumber)) {
    errors.push('Numéro de téléphone invalide');
  }
  
  if (profile.dateOfBirth) {
    const ageValidation = validateAge(profile.dateOfBirth);
    if (!ageValidation.isValid) {
      errors.push(ageValidation.error);
    }
  }
  
  if (profile.gender && !validateGender(profile.gender)) {
    errors.push('Genre invalide');
  }
  
  if (profile.fitnessLevel && !validateFitnessLevel(profile.fitnessLevel)) {
    errors.push('Niveau de fitness invalide');
  }
  
  if (profile.fitnessGoals && !validateFitnessGoals(profile.fitnessGoals)) {
    errors.push('Objectifs de fitness invalides');
  }
  
  // Height validation (either metric or imperial)
  if (profile.unitsPreference === 'metric') {
    if (profile.heightCm && !validateHeightMetric(profile.heightCm)) {
      errors.push('Taille invalide (métrique)');
    }
    if (profile.weightKg && !validateWeightMetric(profile.weightKg)) {
      errors.push('Poids invalide (métrique)');
    }
  } else if (profile.unitsPreference === 'imperial') {
    if ((profile.heightFt || profile.heightIn) && 
        !validateHeightImperial(profile.heightFt, profile.heightIn)) {
      errors.push('Taille invalide (impérial)');
    }
    if (profile.weightLbs && !validateWeightImperial(profile.weightLbs)) {
      errors.push('Poids invalide (impérial)');
    }
  }
  
  if (profile.languagePreference && !validateLanguage(profile.languagePreference)) {
    errors.push('Langue invalide');
  }
  
  if (profile.unitsPreference && !validateUnitsPreference(profile.unitsPreference)) {
    errors.push('Unités invalides');
  }
  
  if (profile.locationLat && profile.locationLng && 
      !validateCoordinates(profile.locationLat, profile.locationLng)) {
    errors.push('Coordonnées de localisation invalides');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateFullName,
  validateAge,
  validateHeightMetric,
  validateHeightImperial,
  validateWeightMetric,
  validateWeightImperial,
  validateFitnessLevel,
  validateFitnessGoals,
  validateGender,
  validateLanguage,
  validateUnitsPreference,
  validateCoordinates,
  validateVerificationCode,
  validateUUID,
  validateUserProfile,
  sanitizeInput
};