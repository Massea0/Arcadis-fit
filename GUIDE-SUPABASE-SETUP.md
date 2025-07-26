# Guide de Configuration Supabase pour Arcadis Fit

Ce guide vous explique comment configurer Supabase pour votre projet Arcadis Fit.

## 📋 Prérequis

- Compte Supabase (gratuit sur [supabase.com](https://supabase.com))
- Node.js 18+ installé
- Git installé

## 🚀 Étapes de Configuration

### 1. Création du Projet Supabase

1. **Connectez-vous à Supabase** : [app.supabase.com](https://app.supabase.com)
2. **Créez un nouveau projet** :
   - Cliquez sur "New Project"
   - Nom du projet : `arcadis-fit`
   - Organisation : Choisissez votre organisation
   - Région : `Europe (Frankfurt)` (proche de l'Afrique)
   - Password : Générez un mot de passe fort (notez-le !)

3. **Attendez la création** (2-3 minutes)

### 2. Configuration des Variables d'Environnement

1. **Récupérez vos clés** dans les Settings > API :
   - `Project URL` 
   - `anon public` key
   - `service_role` key (gardez-la secrète !)

2. **Créez le fichier `.env`** dans le dossier `backend/` :

```bash
# Copiez le fichier .env.example
cp backend/.env.example backend/.env
```

3. **Modifiez le fichier `.env`** avec vos vraies valeurs :

```env
# Configuration du serveur
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Base de données Supabase
SUPABASE_URL=https://votre-project-ref.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# ... autres configurations
```

### 3. Création du Schéma de Base de Données

1. **Ouvrez l'éditeur SQL** dans Supabase :
   - Allez dans "SQL Editor" dans le dashboard
   - Cliquez sur "New query"

2. **Exécutez le schéma** :
   - Copiez le contenu du fichier `database/supabase-schema.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter

3. **Vérifiez les tables** :
   - Allez dans "Table Editor"
   - Vous devriez voir toutes les tables créées

### 4. Configuration du Stockage de Fichiers

1. **Allez dans Storage** dans le dashboard Supabase

2. **Créez les buckets** suivants :
   - `profile-images` (public)
   - `workout-images` (public)
   - `nutrition-images` (public)
   - `documents` (private)
   - `arcadis-fit-uploads` (public)

3. **Configuration des politiques** pour chaque bucket :

```sql
-- Pour profile-images
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to view all images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Allow users to update own images" ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Configuration de l'Authentification

1. **Allez dans Authentication > Settings**

2. **Configurez les URLs** :
   - Site URL : `http://localhost:3000` (développement)
   - Redirect URLs : `http://localhost:3000/auth/callback`

3. **Activez les providers** souhaités :
   - Email/Password (activé par défaut)
   - Google (optionnel)
   - Téléphone/SMS (pour le Sénégal)

### 6. Configuration Email (Optionnel)

Si vous voulez utiliser votre propre service email :

1. **Allez dans Authentication > Settings > SMTP Settings**
2. **Configurez votre SMTP** :
   - Host : `smtp.gmail.com`
   - Port : `587`
   - Username : votre email
   - Password : mot de passe d'application

### 7. Configuration des Politiques de Sécurité (RLS)

Les politiques sont déjà définies dans le schéma, mais vous pouvez les personnaliser :

1. **Allez dans Authentication > Policies**
2. **Vérifiez que RLS est activé** pour toutes les tables sensibles
3. **Personnalisez les politiques** si nécessaire

## 🧪 Test de la Configuration

### 1. Installation des Dépendances

```bash
cd backend
npm install
```

### 2. Test de Connexion

```bash
npm run dev
```

Vous devriez voir :
```
🚀 Arcadis Fit API server running on port 3000
✅ Connexion Supabase établie avec succès
```

### 3. Test de l'API

```bash
# Test d'inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "+221123456789"
  }'
```

## 🔧 Configuration Avancée

### Variables d'Environnement Complètes

```env
# Configuration du serveur
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Base de données Supabase
SUPABASE_URL=https://votre-project-ref.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Configuration JWT (optionnel si vous utilisez Supabase Auth)
JWT_SECRET=votre-jwt-secret-key
JWT_EXPIRES_IN=7d

# Configuration Email
EMAIL_FROM=noreply@arcadisfit.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password

# Configuration de stockage
STORAGE_BUCKET=arcadis-fit-uploads

# Configuration Redis (pour cache et sessions)
REDIS_URL=redis://localhost:6379

# Configuration API externe
DEXCHANGE_API_URL=https://api.dexchange.sn
DEXCHANGE_API_KEY=votre-dexchange-api-key
DEXCHANGE_MERCHANT_ID=votre-merchant-id

# Configuration Twilio (SMS)
TWILIO_ACCOUNT_SID=votre-twilio-account-sid
TWILIO_AUTH_TOKEN=votre-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Configuration AI Services
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=votre-ai-service-key

# Configuration de sécurité
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuration de développement
LOG_LEVEL=debug
ENABLE_SWAGGER=true
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Données de Test

Vous pouvez insérer des données de test :

```sql
-- Insérer des exercices de base
INSERT INTO public.exercises (name, description, muscle_groups, equipment, difficulty_level) VALUES
('Pompes', 'Exercice de base pour le haut du corps', ARRAY['pectoraux', 'triceps', 'deltoïdes'], ARRAY[], 'beginner'),
('Squats', 'Exercice pour les jambes et fessiers', ARRAY['quadriceps', 'fessiers', 'ischio-jambiers'], ARRAY[], 'beginner'),
('Planche', 'Exercice de gainage pour les abdominaux', ARRAY['abdominaux', 'dorsaux'], ARRAY[], 'beginner');

-- Insérer des aliments locaux sénégalais
INSERT INTO public.foods (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, is_local) VALUES
('Riz blanc cuit', 'Céréales', 130, 2.7, 28, 0.3, true),
('Thiéboudienne', 'Plats traditionnels', 180, 12, 25, 4, true),
('Mil', 'Céréales', 378, 11, 73, 4.2, true),
('Bissap', 'Boissons', 37, 0.96, 7.64, 0.65, true);
```

## 🔒 Sécurité en Production

Quand vous déployez en production :

1. **Changez les URLs** dans Authentication > Settings
2. **Utilisez HTTPS** uniquement
3. **Configurez un domaine personnalisé**
4. **Activez la 2FA** sur votre compte Supabase
5. **Surveillez les logs** dans le dashboard

## 📚 Ressources Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Guide JavaScript Supabase](https://supabase.com/docs/reference/javascript)
- [Politiques RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Supabase](https://supabase.com/docs/guides/storage)

## 🆘 Dépannage

### Erreurs Communes

1. **Erreur de connexion** :
   - Vérifiez vos URLs et clés API
   - Assurez-vous que le projet Supabase est actif

2. **Erreur RLS** :
   - Vérifiez que les politiques sont correctement configurées
   - Testez avec un utilisateur administrateur

3. **Erreur d'upload** :
   - Vérifiez que les buckets existent
   - Vérifiez les politiques de storage

4. **Erreur d'authentification** :
   - Vérifiez la configuration des URLs de redirection
   - Vérifiez que l'email est confirmé

### Support

Si vous rencontrez des problèmes :
1. Consultez les logs Supabase dans le dashboard
2. Vérifiez la documentation officielle
3. Contactez l'équipe de développement

---

**Note** : Gardez vos clés API secrètes et ne les commitez jamais dans Git !