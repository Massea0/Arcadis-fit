# Arcadis Fit - Deployment Guide

This guide provides comprehensive instructions for deploying the Arcadis Fit application across all platforms and services.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Backend API Deployment](#backend-api-deployment)
4. [AI Services Deployment](#ai-services-deployment)
5. [iOS App Deployment](#ios-app-deployment)
6. [Android App Deployment](#android-app-deployment)
7. [Web Dashboard Deployment](#web-dashboard-deployment)
8. [Payment Gateway Setup](#payment-gateway-setup)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Production Checklist](#production-checklist)

## Prerequisites

### Required Accounts & Services
- [Supabase](https://supabase.com) - Database & Authentication
- [Twilio](https://twilio.com) - SMS Verification
- [DEXCHANGE](https://dexchange.com) - Payment Gateway
- [Firebase](https://firebase.google.com) - Push Notifications
- [Apple Developer Account](https://developer.apple.com) - iOS App Store
- [Google Play Console](https://play.google.com/console) - Android App Store
- [Vercel](https://vercel.com) - Web Dashboard Hosting
- [GitHub](https://github.com) - Code Repository

### Development Tools
- Node.js 18+
- Python 3.9+
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- Docker & Docker Compose
- Git

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Set database password (save securely)
5. Choose region closest to Senegal (Europe West)

### 2. Configure Database

1. **Run Schema Migration**
   ```bash
   # Connect to Supabase SQL Editor
   # Copy and paste the contents of database/schema.sql
   # Execute the script
   ```

2. **Enable Row Level Security (RLS)**
   - All tables have RLS enabled by default
   - Policies are defined in the schema

3. **Configure Storage**
   ```sql
   -- Create storage bucket for user assets
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('arcadis-fit-assets', 'arcadis-fit-assets', true);
   ```

### 3. Get API Keys

1. Go to Settings > API
2. Copy the following:
   - Project URL
   - Anon (public) key
   - Service role key (keep secret)

## Backend API Deployment

### Option 1: Vercel Deployment (Recommended)

1. **Prepare Repository**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   - Create `.env` file from `.env.example`
   - Fill in all required values

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   
   # Follow prompts and set environment variables
   ```

4. **Configure Custom Domain** (Optional)
   - Add custom domain in Vercel dashboard
   - Update DNS records

### Option 2: Docker Deployment

1. **Build Docker Image**
   ```bash
   cd backend
   docker build -t arcadis-fit-backend .
   ```

2. **Run with Docker Compose**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     backend:
       image: arcadis-fit-backend
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - SUPABASE_URL=${SUPABASE_URL}
         - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
         # Add other environment variables
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional Server Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or CentOS 8+
   - Node.js 18+
   - PM2 for process management
   - Nginx for reverse proxy

2. **Setup Script**
   ```bash
   # Install dependencies
   sudo apt update
   sudo apt install nodejs npm nginx
   
   # Install PM2
   npm install -g pm2
   
   # Clone repository
   git clone https://github.com/your-org/arcadis-fit.git
   cd arcadis-fit/backend
   
   # Install dependencies
   npm install
   
   # Start with PM2
   pm2 start server.js --name "arcadis-fit-backend"
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name api.arcadis-fit.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## AI Services Deployment

### Nutrition AI Service

1. **Prepare Environment**
   ```bash
   cd ai-services/nutrition-ai
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Deploy with Docker**
   ```bash
   # Build image
   docker build -t arcadis-fit-nutrition-ai .
   
   # Run container
   docker run -d \
     --name nutrition-ai \
     -p 8001:8001 \
     -e SUPABASE_URL=${SUPABASE_URL} \
     -e SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY} \
     arcadis-fit-nutrition-ai
   ```

3. **Deploy to Cloud Run (Google Cloud)**
   ```bash
   # Build and push to Google Container Registry
   gcloud builds submit --tag gcr.io/PROJECT_ID/nutrition-ai
   
   # Deploy to Cloud Run
   gcloud run deploy nutrition-ai \
     --image gcr.io/PROJECT_ID/nutrition-ai \
     --platform managed \
     --region europe-west1 \
     --allow-unauthenticated
   ```

### Workout AI Service

Follow the same steps as Nutrition AI, but use port 8002 and the workout-ai directory.

## iOS App Deployment

### 1. Prepare for App Store

1. **Configure Xcode Project**
   ```bash
   cd ios
   open ArcadisFit.xcworkspace
   ```

2. **Update Bundle Identifier**
   - Change to your unique identifier: `com.yourcompany.arcadis-fit`

3. **Configure Signing**
   - Add your Apple Developer account
   - Create App ID in Apple Developer Console
   - Create provisioning profiles

4. **Update Configuration**
   - Set API base URL to production
   - Update app icons and launch screen
   - Configure push notifications

### 2. Build and Archive

1. **Select Generic iOS Device**
2. **Product > Archive**
3. **Upload to App Store Connect**

### 3. App Store Connect Setup

1. **Create App**
   - App name: "Arcadis Fit"
   - Bundle ID: `com.yourcompany.arcadis-fit`
   - SKU: `arcadis-fit-ios`

2. **App Information**
   - Description in French and English
   - Screenshots for different device sizes
   - App Store categories: Health & Fitness

3. **Submit for Review**
   - Complete all required information
   - Test with TestFlight first
   - Submit for App Store review

## Android App Deployment

### 1. Prepare for Google Play Store

1. **Configure Build**
   ```bash
   cd android
   # Update applicationId in app/build.gradle
   applicationId "com.yourcompany.arcadis-fit"
   ```

2. **Generate Signed APK**
   ```bash
   # Create keystore
   keytool -genkey -v -keystore arcadis-fit.keystore -alias arcadis-fit -keyalg RSA -keysize 2048 -validity 10000
   
   # Build signed APK
   ./gradlew assembleRelease
   ```

3. **Update Configuration**
   - Set API base URL to production
   - Update app icons and splash screen
   - Configure Firebase for push notifications

### 2. Google Play Console Setup

1. **Create App**
   - App name: "Arcadis Fit"
   - Package name: `com.yourcompany.arcadis-fit`

2. **App Information**
   - Description in French and English
   - Screenshots and feature graphic
   - Content rating questionnaire

3. **Release Management**
   - Upload APK/AAB to internal testing
   - Test with internal testers
   - Release to production

## Web Dashboard Deployment

### Vercel Deployment (Recommended)

1. **Prepare Project**
   ```bash
   cd web-dashboard
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Create .env.local
   NEXT_PUBLIC_API_URL=https://api.arcadis-fit.com
   NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
   NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Custom Domain**
   - Add `dashboard.arcadis-fit.com` in Vercel
   - Update DNS records

## Payment Gateway Setup

### DEXCHANGE Integration

1. **Create Merchant Account**
   - Register at [DEXCHANGE](https://dexchange.com)
   - Complete KYC verification
   - Get API credentials

2. **Configure Webhooks**
   - Set callback URL: `https://api.arcadis-fit.com/api/payments/callback`
   - Test webhook delivery

3. **Test Payments**
   - Use test credentials first
   - Test with small amounts
   - Verify callback handling

### Alternative Payment Methods

1. **Wave Mobile Money**
   - Register as merchant
   - Integrate Wave API
   - Test transactions

2. **Orange Money**
   - Contact Orange Money Senegal
   - Complete merchant registration
   - Integrate payment API

## Monitoring & Analytics

### 1. Application Monitoring

1. **Sentry Setup**
   ```bash
   # Install Sentry CLI
   npm install -g @sentry/cli
   
   # Initialize Sentry
   sentry init
   ```

2. **Configure Error Tracking**
   - Add Sentry DSN to environment variables
   - Test error reporting

### 2. Analytics Setup

1. **Google Analytics**
   - Create GA4 property
   - Add tracking code to web dashboard
   - Configure mobile app tracking

2. **Firebase Analytics**
   - Enable in Firebase console
   - Add to mobile apps
   - Set up custom events

### 3. Performance Monitoring

1. **Vercel Analytics** (for web)
   - Enable in Vercel dashboard
   - Monitor Core Web Vitals

2. **App Store Connect Analytics** (for iOS)
   - Monitor app performance
   - Track user engagement

3. **Google Play Console Analytics** (for Android)
   - Monitor app performance
   - Track user engagement

## Production Checklist

### Security
- [ ] All API keys are secured
- [ ] HTTPS enabled everywhere
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] CORS properly configured

### Performance
- [ ] Database indexes optimized
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Caching strategy implemented
- [ ] API response times < 200ms

### Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring set up
- [ ] Log aggregation configured
- [ ] Alert system in place

### Compliance
- [ ] GDPR compliance implemented
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent configured
- [ ] Data retention policies set

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Load testing completed
- [ ] Security testing performed

### Documentation
- [ ] API documentation updated
- [ ] User guides created
- [ ] Admin documentation complete
- [ ] Deployment procedures documented
- [ ] Troubleshooting guide available

## Maintenance & Updates

### Regular Tasks
- **Weekly**: Monitor performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Full system review

### Backup Strategy
- **Database**: Daily automated backups
- **Files**: Weekly backups
- **Configuration**: Version controlled
- **Disaster Recovery**: Tested quarterly

### Scaling Considerations
- **Database**: Consider read replicas
- **API**: Load balancer for multiple instances
- **CDN**: Global content delivery
- **Caching**: Redis for session storage

## Support & Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check Supabase status
   - Verify connection strings
   - Check network connectivity

2. **Payment Processing Errors**
   - Verify DEXCHANGE credentials
   - Check webhook configuration
   - Review transaction logs

3. **Push Notification Failures**
   - Verify Firebase configuration
   - Check device token validity
   - Review notification settings

### Support Channels
- **Technical Support**: support@arcadis-fit.com
- **Documentation**: https://docs.arcadis-fit.com
- **Community**: https://community.arcadis-fit.com
- **Status Page**: https://status.arcadis-fit.com

---

**Note**: This deployment guide should be updated as the application evolves. Always test changes in a staging environment before deploying to production.