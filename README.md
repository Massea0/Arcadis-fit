# Arcadis Fit - Comprehensive Fitness Platform for Senegal

A complete fitness application tailored for the Senegalese market, featuring AI-powered coaching, local payment integration, and culturally adapted nutrition planning.

## 🌟 Core Features

### 1. Seamless Onboarding Flow
- Multi-language support (French, English, Wolof-ready)
- Phone verification for Senegalese networks
- Comprehensive user profiling
- Fitness level assessment
- Location-based services

### 2. Digital Gym Access & Membership
- QR code-based gym access
- Local payment integration (Wave, Orange Money)
- Real-time gym capacity monitoring
- Membership management

### 3. AI-Powered Nutrition & Meal Planning
- Senegalese diet-focused meal plans
- Local ingredient database
- AI-generated personalized recommendations
- Traditional recipe adaptations

### 4. Advanced Workout Tracking & Coaching
- Comprehensive exercise library
- AI-powered performance analysis
- Wearable device integration
- Progress visualization

## 🏗️ Architecture

- **Frontend**: Native iOS (Swift/SwiftUI) & Android (Kotlin/Jetpack Compose)
- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **AI Services**: TensorFlow/Python for ML models
- **Payment**: DEXCHANGE API integration
- **Authentication**: Supabase Auth

## 📱 Platform Support

- iOS 15.0+ (SwiftUI)
- Android 8.0+ (Jetpack Compose)
- Web Dashboard (React/Next.js)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd arcadis-fit
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

3. **iOS Setup**
```bash
cd ios
pod install
open ArcadisFit.xcworkspace
```

4. **Android Setup**
```bash
cd android
./gradlew build
```

## 🌍 Localization

- Primary: French
- Secondary: English
- Future: Wolof support

## 💰 Payment Integration

- Wave Mobile Money
- Orange Money Senegal
- DEXCHANGE API
- Currency: XOF (West African CFA franc)

## 🔐 Security Features

- End-to-end encryption
- Secure payment processing
- GDPR compliance
- Data privacy controls

## 📊 Database Schema

Comprehensive PostgreSQL schema with tables for:
- User profiles and authentication
- Membership and payments
- Nutrition and meal planning
- Workout tracking and progress
- AI model outputs

## 🤖 AI Features

- Personalized meal planning
- Workout performance analysis
- Form correction (future)
- Injury prevention recommendations
- Adaptive coaching

## 📞 Support

For technical support or feature requests, please contact the development team.

---

**Built with ❤️ for the Senegalese fitness community**