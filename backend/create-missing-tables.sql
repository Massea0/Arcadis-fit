-- Script pour créer les tables manquantes d'Arcadis Fit
-- Tables : memberships, nutrition, gym_checkins, payment_methods, user_preferences

-- =======================================================
-- 1. TABLE MEMBERSHIPS (Abonnements des utilisateurs)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.membership_plans(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'suspended')),
    payment_id UUID REFERENCES public.payments(id),
    gym_id UUID REFERENCES public.gyms(id),
    
    -- Dates importantes
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    activated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Détails financiers
    price_paid_xof INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'XOF',
    discount_applied INTEGER DEFAULT 0,
    
    -- Métadonnées
    auto_renewal BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Index composites
    UNIQUE(user_id, plan_id, starts_at)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_expires_at ON public.memberships(expires_at);
CREATE INDEX IF NOT EXISTS idx_memberships_gym_id ON public.memberships(gym_id);

-- =======================================================
-- 2. TABLE NUTRITION (Suivi nutritionnel)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.nutrition (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations de base
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_name VARCHAR(255) NOT NULL,
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TIME,
    
    -- Valeurs nutritionnelles
    calories INTEGER DEFAULT 0,
    proteins_g DECIMAL(6,2) DEFAULT 0,
    carbs_g DECIMAL(6,2) DEFAULT 0,
    fats_g DECIMAL(6,2) DEFAULT 0,
    fiber_g DECIMAL(6,2) DEFAULT 0,
    sugar_g DECIMAL(6,2) DEFAULT 0,
    sodium_mg DECIMAL(8,2) DEFAULT 0,
    
    -- Détails du repas
    ingredients JSONB DEFAULT '[]',
    portion_size VARCHAR(100),
    preparation_method VARCHAR(255),
    location VARCHAR(100),
    
    -- Photos et notes
    image_url TEXT,
    notes TEXT,
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
    hunger_before INTEGER CHECK (hunger_before BETWEEN 1 AND 10),
    satisfaction_after INTEGER CHECK (satisfaction_after BETWEEN 1 AND 10),
    
    -- Métadonnées IA
    ai_analyzed BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(3,2),
    ai_suggestions JSONB DEFAULT '[]',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    UNIQUE(user_id, meal_date, meal_time, meal_name)
);

-- Index pour optimiser les requêtes nutrition
CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON public.nutrition(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_meal_type ON public.nutrition(meal_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_calories ON public.nutrition(calories);

-- =======================================================
-- 3. TABLE GYM_CHECKINS (Check-ins dans les salles)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.gym_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id),
    membership_id UUID REFERENCES public.memberships(id),
    
    -- Informations de check-in
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_out_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Données de localisation
    check_in_method VARCHAR(20) DEFAULT 'qr_code' CHECK (check_in_method IN ('qr_code', 'manual', 'nfc', 'app')),
    qr_code_used VARCHAR(255),
    location_verified BOOLEAN DEFAULT false,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Activités prévues/réalisées
    planned_activities JSONB DEFAULT '[]',
    completed_activities JSONB DEFAULT '[]',
    calories_burned_estimate INTEGER DEFAULT 0,
    
    -- Évaluation de la session
    session_rating INTEGER CHECK (session_rating BETWEEN 1 AND 5),
    equipment_used JSONB DEFAULT '[]',
    workout_intensity VARCHAR(20) CHECK (workout_intensity IN ('low', 'moderate', 'high', 'very_high')),
    
    -- Notes et commentaires
    notes TEXT,
    mood_before VARCHAR(20),
    mood_after VARCHAR(20),
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    auto_checkout_at TIMESTAMPTZ, -- Pour les check-outs automatiques
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les check-ins
CREATE INDEX IF NOT EXISTS idx_gym_checkins_user_id ON public.gym_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_checkins_gym_id ON public.gym_checkins(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_checkins_date ON public.gym_checkins(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_gym_checkins_status ON public.gym_checkins(status);

-- =======================================================
-- 4. TABLE PAYMENT_METHODS (Méthodes de paiement)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informations de base
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- 'wave', 'orange_money', 'visa', 'mastercard'
    type VARCHAR(20) NOT NULL CHECK (type IN ('mobile_money', 'card', 'bank_transfer', 'cash')),
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    min_amount_xof INTEGER DEFAULT 0,
    max_amount_xof INTEGER DEFAULT 10000000,
    
    -- Frais et commissions
    fixed_fee_xof INTEGER DEFAULT 0,
    percentage_fee DECIMAL(5,4) DEFAULT 0, -- Ex: 0.025 pour 2.5%
    currency_supported VARCHAR(10)[] DEFAULT ARRAY['XOF'],
    
    -- Configuration technique
    api_endpoint TEXT,
    api_version VARCHAR(20),
    requires_phone BOOLEAN DEFAULT false,
    requires_otp BOOLEAN DEFAULT false,
    processing_time_minutes INTEGER DEFAULT 5,
    
    -- Interface utilisateur
    display_name_fr VARCHAR(100),
    display_name_en VARCHAR(100),
    description_fr TEXT,
    description_en TEXT,
    icon_url TEXT,
    color_code VARCHAR(7), -- Code couleur hex
    
    -- Instructions pour l'utilisateur
    instructions_fr TEXT,
    instructions_en TEXT,
    help_url TEXT,
    
    -- Statut et disponibilité
    availability JSONB DEFAULT '{"24/7": true}', -- Horaires de disponibilité
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index pour les méthodes de paiement
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON public.payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider ON public.payment_methods(provider);

-- =======================================================
-- 5. TABLE USER_PREFERENCES (Préférences utilisateur)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Préférences générales
    language VARCHAR(5) DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'wo')),
    timezone VARCHAR(50) DEFAULT 'Africa/Dakar',
    currency VARCHAR(3) DEFAULT 'XOF',
    
    -- Notifications
    notifications JSONB DEFAULT '{
        "email": {
            "workout_reminders": true,
            "payment_confirmations": true,
            "membership_expiry": true,
            "promotional": false,
            "weekly_summary": true
        },
        "push": {
            "workout_reminders": true,
            "check_in_reminders": true,
            "goal_achievements": true,
            "social_interactions": false
        },
        "sms": {
            "payment_confirmations": true,
            "emergency_notifications": true,
            "membership_expiry": true
        }
    }',
    
    -- Préférences d'entraînement
    workout_preferences JSONB DEFAULT '{
        "preferred_time": "morning",
        "duration_minutes": 60,
        "intensity": "moderate",
        "rest_days": ["sunday"],
        "focus_areas": ["strength", "cardio"],
        "equipment_access": ["full_gym"]
    }',
    
    -- Préférences nutritionnelles
    nutrition_preferences JSONB DEFAULT '{
        "dietary_restrictions": [],
        "allergies": [],
        "calorie_goal": 2000,
        "protein_goal_g": 150,
        "meal_reminders": true,
        "water_goal_liters": 2.5
    }',
    
    -- Préférences de confidentialité
    privacy_settings JSONB DEFAULT '{
        "profile_visibility": "friends",
        "workout_sharing": false,
        "progress_sharing": false,
        "location_sharing": false,
        "data_analytics": true
    }',
    
    -- Préférences d'interface
    ui_preferences JSONB DEFAULT '{
        "theme": "auto",
        "units": "metric",
        "date_format": "dd/mm/yyyy",
        "first_day_of_week": "monday",
        "dashboard_widgets": ["progress", "workouts", "nutrition"]
    }',
    
    -- Préférences de communication
    communication_preferences JSONB DEFAULT '{
        "marketing_emails": false,
        "research_participation": false,
        "feedback_requests": true,
        "community_features": true
    }',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les préférences utilisateur
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON public.user_preferences(language);

-- =======================================================
-- TRIGGERS POUR LA MISE À JOUR AUTOMATIQUE
-- =======================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer les triggers sur toutes les nouvelles tables
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nutrition_updated_at BEFORE UPDATE ON public.nutrition FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_checkins_updated_at BEFORE UPDATE ON public.gym_checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques pour memberships
CREATE POLICY "Users can view their own memberships" ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memberships" ON public.memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memberships" ON public.memberships FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour nutrition
CREATE POLICY "Users can manage their own nutrition data" ON public.nutrition FOR ALL USING (auth.uid() = user_id);

-- Politiques pour gym_checkins
CREATE POLICY "Users can manage their own checkins" ON public.gym_checkins FOR ALL USING (auth.uid() = user_id);

-- Politiques pour payment_methods (lecture seule pour tous, modification admin seulement)
CREATE POLICY "Everyone can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);

-- Politiques pour user_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- =======================================================
-- DONNÉES INITIALES
-- =======================================================

-- Insérer les méthodes de paiement par défaut
INSERT INTO public.payment_methods (name, code, provider, type, display_name_fr, display_name_en, icon_url, color_code, instructions_fr) VALUES
('Wave', 'WAVE', 'wave', 'mobile_money', 'Wave Money', 'Wave Money', '/icons/wave.png', '#1E40AF', 'Payez avec votre portefeuille Wave en saisissant votre numéro de téléphone'),
('Orange Money', 'ORANGE_MONEY', 'orange_money', 'mobile_money', 'Orange Money', 'Orange Money', '/icons/orange.png', '#FF6600', 'Payez avec Orange Money en composant #144#'),
('Visa', 'VISA', 'dexchange', 'card', 'Carte Visa', 'Visa Card', '/icons/visa.png', '#1A1F71', 'Payez en toute sécurité avec votre carte Visa'),
('Mastercard', 'MASTERCARD', 'dexchange', 'card', 'Carte Mastercard', 'Mastercard', '/icons/mastercard.png', '#EB001B', 'Payez en toute sécurité avec votre carte Mastercard')
ON CONFLICT (code) DO NOTHING;

-- Marquer Wave comme méthode par défaut
UPDATE public.payment_methods SET is_default = true WHERE code = 'WAVE';

-- =======================================================
-- COMMENTAIRES POUR LA DOCUMENTATION
-- =======================================================

COMMENT ON TABLE public.memberships IS 'Abonnements des utilisateurs aux différents plans';
COMMENT ON TABLE public.nutrition IS 'Suivi nutritionnel quotidien des utilisateurs';
COMMENT ON TABLE public.gym_checkins IS 'Check-ins et check-outs des utilisateurs dans les salles de sport';
COMMENT ON TABLE public.payment_methods IS 'Méthodes de paiement disponibles (Wave, Orange Money, cartes)';
COMMENT ON TABLE public.user_preferences IS 'Préférences et paramètres personnalisés des utilisateurs';

-- =======================================================
-- FONCTIONS UTILITAIRES
-- =======================================================

-- Fonction pour créer des préférences par défaut pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement les préférences lors de l'inscription
-- (S'applique sur auth.users si accessible, sinon à appliquer manuellement)

-- =======================================================
-- VUES UTILES POUR LES RAPPORTS
-- =======================================================

-- Vue pour les abonnements actifs
CREATE OR REPLACE VIEW active_memberships AS
SELECT 
    m.id,
    m.user_id,
    p.email,
    p.first_name,
    p.last_name,
    mp.name as plan_name,
    m.starts_at,
    m.expires_at,
    m.price_paid_xof,
    g.name as gym_name
FROM public.memberships m
JOIN public.profiles p ON p.id = m.user_id
LEFT JOIN public.membership_plans mp ON mp.id = m.plan_id
LEFT JOIN public.gyms g ON g.id = m.gym_id
WHERE m.status = 'active' AND m.expires_at > NOW();

-- Vue pour les statistiques de fréquentation des salles
CREATE OR REPLACE VIEW gym_attendance_stats AS
SELECT 
    g.name as gym_name,
    DATE(gc.checked_in_at) as date,
    COUNT(*) as total_checkins,
    COUNT(DISTINCT gc.user_id) as unique_visitors,
    AVG(gc.duration_minutes) as avg_duration_minutes
FROM public.gym_checkins gc
JOIN public.gyms g ON g.id = gc.gym_id
WHERE gc.checked_in_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY g.name, DATE(gc.checked_in_at)
ORDER BY date DESC;

-- =======================================================
-- SUCCÈS !
-- =======================================================

-- Script terminé avec succès
SELECT 'Tables manquantes créées avec succès ! 🎉' as message;