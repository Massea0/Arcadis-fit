#!/usr/bin/env python3
"""
Arcadis Fit - AI Workout Service
AI-powered workout planning and exercise recommendation service
"""

import os
import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, date, timedelta
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import tensorflow as tf
from tensorflow import keras
import joblib
from sklearn.preprocessing import StandardScaler, LabelEncoder
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Arcadis Fit Workout AI",
    description="AI-powered workout planning and exercise recommendation service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models and data
workout_model = None
exercise_database = None
senegalese_exercises = None
scaler = None
label_encoders = {}

class UserProfile(BaseModel):
    """User profile for workout planning"""
    user_id: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    fitness_level: str = Field(..., description="beginner, intermediate, advanced")
    fitness_goals: List[str] = Field(..., description="weight_loss, muscle_gain, endurance, strength, etc.")
    experience_years: int = 0
    available_equipment: List[str] = Field(default_factory=list)
    time_availability: int = Field(..., description="Minutes available per workout")
    injuries: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    language: str = "fr"

class WorkoutPlanRequest(BaseModel):
    """Request for workout plan generation"""
    user_profile: UserProfile
    duration_weeks: int = 4
    workouts_per_week: int = 3
    focus_areas: List[str] = Field(default_factory=list)
    include_cardio: bool = True
    include_strength: bool = True
    include_flexibility: bool = True

class Exercise(BaseModel):
    """Exercise model"""
    id: str
    name: str
    name_fr: Optional[str] = None
    name_wo: Optional[str] = None
    category: str
    muscle_groups: List[str]
    equipment_needed: List[str]
    difficulty_level: str
    is_senegalese: bool = False
    instructions: List[str]
    instructions_fr: Optional[List[str]] = None
    instructions_wo: Optional[List[str]] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    estimated_calories_per_minute: float
    rest_time_seconds: int
    sets_recommended: Dict[str, List[int]]  # difficulty -> [min_sets, max_sets]
    reps_recommended: Dict[str, List[int]]  # difficulty -> [min_reps, max_reps]

class WorkoutSession(BaseModel):
    """Individual workout session"""
    id: str
    name: str
    name_fr: Optional[str] = None
    category: str
    duration_minutes: int
    difficulty_level: str
    exercises: List[Dict[str, Any]]
    warm_up: List[Dict[str, Any]]
    cool_down: List[Dict[str, Any]]
    total_calories: float
    target_muscle_groups: List[str]
    equipment_needed: List[str]
    notes: str

class WorkoutPlanResponse(BaseModel):
    """Response for workout plan generation"""
    user_id: str
    start_date: date
    end_date: date
    total_weeks: int
    workouts_per_week: int
    total_workouts: int
    sessions: List[WorkoutSession]
    progression_plan: Dict[str, Any]
    equipment_requirements: List[str]
    nutrition_recommendations: List[str]

class WorkoutRecommendation(BaseModel):
    """Workout recommendation"""
    type: str
    title: str
    description: str
    confidence_score: float
    actionable_items: List[str]
    senegalese_context: Optional[str] = None

def load_models():
    """Load AI models and data"""
    global workout_model, exercise_database, senegalese_exercises, scaler, label_encoders
    
    try:
        # Load workout recommendation model
        model_path = os.getenv("WORKOUT_MODEL_PATH", "models/workout_recommendation_model.h5")
        if os.path.exists(model_path):
            workout_model = keras.models.load_model(model_path)
            logger.info("Workout model loaded successfully")
        
        # Load exercise database
        exercise_db_path = os.getenv("EXERCISE_DATABASE_PATH", "data/exercise_database.json")
        if os.path.exists(exercise_db_path):
            with open(exercise_db_path, 'r', encoding='utf-8') as f:
                exercise_database = json.load(f)
            logger.info("Exercise database loaded successfully")
        
        # Load Senegalese exercises specifically
        senegalese_path = os.getenv("SENEGALESE_EXERCISES_PATH", "data/senegalese_exercises.json")
        if os.path.exists(senegalese_path):
            with open(senegalese_path, 'r', encoding='utf-8') as f:
                senegalese_exercises = json.load(f)
            logger.info("Senegalese exercises database loaded successfully")
        
        # Load scaler and encoders
        scaler_path = os.getenv("SCALER_PATH", "models/scaler.pkl")
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
        
        # Load label encoders
        encoders_path = os.getenv("ENCODERS_PATH", "models/label_encoders.pkl")
        if os.path.exists(encoders_path):
            label_encoders = joblib.load(encoders_path)
        
        logger.info("All models and data loaded successfully")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        raise

def calculate_workout_intensity(fitness_level: str, goals: List[str]) -> Dict[str, float]:
    """Calculate workout intensity based on fitness level and goals"""
    base_intensity = {
        "beginner": 0.6,
        "intermediate": 0.75,
        "advanced": 0.9
    }
    
    intensity = base_intensity.get(fitness_level, 0.7)
    
    # Adjust based on goals
    if "muscle_gain" in goals:
        intensity *= 1.1
    elif "weight_loss" in goals:
        intensity *= 1.05
    elif "endurance" in goals:
        intensity *= 0.95
    
    return {
        "overall": intensity,
        "strength": intensity * 1.1 if "strength" in goals else intensity,
        "cardio": intensity * 1.05 if "endurance" in goals else intensity * 0.9,
        "flexibility": 0.8
    }

def get_exercise_recommendations(
    muscle_groups: List[str], 
    difficulty: str, 
    equipment: List[str],
    time_available: int,
    exclude_exercises: List[str] = None
) -> List[Dict[str, Any]]:
    """Get exercise recommendations based on criteria"""
    if not exercise_database:
        return []
    
    recommendations = []
    exclude_exercises = exclude_exercises or []
    
    for exercise in exercise_database:
        # Skip if exercise is excluded
        if exercise["id"] in exclude_exercises:
            continue
        
        # Check if exercise targets desired muscle groups
        if not any(mg in exercise.get("muscle_groups", []) for mg in muscle_groups):
            continue
        
        # Check difficulty level
        if exercise.get("difficulty_level") != difficulty:
            continue
        
        # Check equipment availability
        exercise_equipment = exercise.get("equipment_needed", [])
        if exercise_equipment and not all(eq in equipment for eq in exercise_equipment):
            continue
        
        # Calculate estimated time for this exercise
        sets_range = exercise.get("sets_recommended", {}).get(difficulty, [3, 4])
        reps_range = exercise.get("reps_recommended", {}).get(difficulty, [8, 12])
        rest_time = exercise.get("rest_time_seconds", 90)
        
        avg_sets = sum(sets_range) / len(sets_range)
        avg_reps = sum(reps_range) / len(reps_range)
        
        # Estimate time: (sets * reps * 3 seconds) + (rest time * (sets-1))
        estimated_time = (avg_sets * avg_reps * 3) + (rest_time * (avg_sets - 1))
        estimated_time_minutes = estimated_time / 60
        
        if estimated_time_minutes <= time_available:
            exercise_copy = exercise.copy()
            exercise_copy["estimated_time_minutes"] = estimated_time_minutes
            exercise_copy["recommended_sets"] = sets_range
            exercise_copy["recommended_reps"] = reps_range
            recommendations.append(exercise_copy)
    
    # Sort by relevance and time efficiency
    recommendations.sort(key=lambda x: (
        len(set(muscle_groups) & set(x.get("muscle_groups", []))),
        -x.get("estimated_time_minutes", 0)
    ), reverse=True)
    
    return recommendations[:10]  # Return top 10 recommendations

def generate_workout_session(
    session_type: str,
    muscle_groups: List[str],
    difficulty: str,
    equipment: List[str],
    time_available: int,
    language: str = "fr"
) -> WorkoutSession:
    """Generate a single workout session"""
    
    # Define session structure based on type
    session_structures = {
        "strength": {
            "warm_up_ratio": 0.15,
            "main_workout_ratio": 0.75,
            "cool_down_ratio": 0.10
        },
        "cardio": {
            "warm_up_ratio": 0.20,
            "main_workout_ratio": 0.70,
            "cool_down_ratio": 0.10
        },
        "flexibility": {
            "warm_up_ratio": 0.10,
            "main_workout_ratio": 0.80,
            "cool_down_ratio": 0.10
        }
    }
    
    structure = session_structures.get(session_type, session_structures["strength"])
    
    # Calculate time allocation
    warm_up_time = int(time_available * structure["warm_up_ratio"])
    main_workout_time = int(time_available * structure["main_workout_ratio"])
    cool_down_time = int(time_available * structure["cool_down_ratio"])
    
    # Get exercise recommendations
    main_exercises = get_exercise_recommendations(
        muscle_groups, difficulty, equipment, main_workout_time
    )
    
    warm_up_exercises = get_exercise_recommendations(
        ["full_body"], "beginner", ["none"], warm_up_time
    )
    
    cool_down_exercises = get_exercise_recommendations(
        ["full_body"], "beginner", ["none"], cool_down_time
    )
    
    # Calculate total calories
    total_calories = sum(
        ex.get("estimated_calories_per_minute", 5) * ex.get("estimated_time_minutes", 5)
        for ex in main_exercises + warm_up_exercises + cool_down_exercises
    )
    
    # Generate session name
    session_names = {
        "fr": {
            "strength": f"Entraînement Force - {', '.join(muscle_groups)}",
            "cardio": "Entraînement Cardio",
            "flexibility": "Entraînement Flexibilité"
        },
        "en": {
            "strength": f"Strength Training - {', '.join(muscle_groups)}",
            "cardio": "Cardio Training",
            "flexibility": "Flexibility Training"
        }
    }
    
    name = session_names.get(language, session_names["fr"]).get(session_type, "Workout")
    
    return WorkoutSession(
        id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        name=name,
        name_fr=name if language == "fr" else None,
        category=session_type,
        duration_minutes=time_available,
        difficulty_level=difficulty,
        exercises=main_exercises,
        warm_up=warm_up_exercises,
        cool_down=cool_down_exercises,
        total_calories=total_calories,
        target_muscle_groups=muscle_groups,
        equipment_needed=list(set(
            eq for ex in main_exercises 
            for eq in ex.get("equipment_needed", [])
        )),
        notes=generate_workout_notes(session_type, language)
    )

def generate_workout_plan(user_profile: UserProfile, request: WorkoutPlanRequest) -> WorkoutPlanResponse:
    """Generate personalized workout plan"""
    
    # Calculate workout intensity
    intensity = calculate_workout_intensity(user_profile.fitness_level, user_profile.fitness_goals)
    
    # Determine focus areas if not specified
    if not request.focus_areas:
        if "muscle_gain" in user_profile.fitness_goals:
            request.focus_areas = ["chest", "back", "legs", "shoulders", "arms"]
        elif "weight_loss" in user_profile.fitness_goals:
            request.focus_areas = ["full_body", "core"]
        else:
            request.focus_areas = ["full_body"]
    
    # Generate sessions for each week
    sessions = []
    start_date = date.today()
    total_sessions = request.duration_weeks * request.workouts_per_week
    
    # Define weekly workout split
    weekly_split = []
    if request.workouts_per_week == 3:
        weekly_split = ["strength", "cardio", "strength"]
    elif request.workouts_per_week == 4:
        weekly_split = ["strength", "cardio", "strength", "flexibility"]
    elif request.workouts_per_week == 5:
        weekly_split = ["strength", "cardio", "strength", "cardio", "strength"]
    else:
        weekly_split = ["strength"] * request.workouts_per_week
    
    session_count = 0
    for week in range(request.duration_weeks):
        for day in range(request.workouts_per_week):
            if session_count >= total_sessions:
                break
            
            session_type = weekly_split[day % len(weekly_split)]
            
            # Determine muscle groups for this session
            if session_type == "strength":
                # Rotate through focus areas
                muscle_groups = [request.focus_areas[session_count % len(request.focus_areas)]]
            elif session_type == "cardio":
                muscle_groups = ["full_body"]
            else:  # flexibility
                muscle_groups = ["full_body"]
            
            # Generate session
            session = generate_workout_session(
                session_type=session_type,
                muscle_groups=muscle_groups,
                difficulty=user_profile.fitness_level,
                equipment=user_profile.available_equipment,
                time_available=user_profile.time_availability,
                language=user_profile.language
            )
            
            sessions.append(session)
            session_count += 1
    
    # Generate progression plan
    progression_plan = generate_progression_plan(
        user_profile, request, intensity
    )
    
    # Generate equipment requirements
    equipment_requirements = list(set(
        eq for session in sessions
        for eq in session.equipment_needed
    ))
    
    # Generate nutrition recommendations
    nutrition_recommendations = generate_nutrition_recommendations(
        user_profile, sessions
    )
    
    return WorkoutPlanResponse(
        user_id=user_profile.user_id,
        start_date=start_date,
        end_date=start_date + timedelta(weeks=request.duration_weeks),
        total_weeks=request.duration_weeks,
        workouts_per_week=request.workouts_per_week,
        total_workouts=len(sessions),
        sessions=sessions,
        progression_plan=progression_plan,
        equipment_requirements=equipment_requirements,
        nutrition_recommendations=nutrition_recommendations
    )

def generate_progression_plan(user_profile: UserProfile, request: WorkoutPlanRequest, intensity: Dict[str, float]) -> Dict[str, Any]:
    """Generate progression plan for the workout program"""
    
    progression = {
        "weeks": [],
        "intensity_increase": 0.05,  # 5% increase per week
        "volume_increase": 0.10,     # 10% increase per week
        "deload_week": 4             # Deload every 4 weeks
    }
    
    for week in range(request.duration_weeks):
        week_plan = {
            "week_number": week + 1,
            "intensity_multiplier": 1 + (week * progression["intensity_increase"]),
            "volume_multiplier": 1 + (week * progression["volume_increase"]),
            "is_deload": (week + 1) % progression["deload_week"] == 0,
            "focus": "Progression continue" if not (week + 1) % progression["deload_week"] == 0 else "Récupération"
        }
        
        if week_plan["is_deload"]:
            week_plan["intensity_multiplier"] *= 0.8
            week_plan["volume_multiplier"] *= 0.7
        
        progression["weeks"].append(week_plan)
    
    return progression

def generate_nutrition_recommendations(user_profile: UserProfile, sessions: List[WorkoutSession]) -> List[str]:
    """Generate nutrition recommendations based on workout plan"""
    recommendations = []
    
    # Calculate total weekly calories burned
    weekly_calories = sum(session.total_calories for session in sessions)
    
    if weekly_calories > 2000:
        recommendations.append("Augmentez votre apport en protéines pour soutenir la récupération musculaire.")
        recommendations.append("Consommez des glucides complexes avant vos entraînements.")
    
    if any("cardio" in session.category for session in sessions):
        recommendations.append("Hydratez-vous bien avant, pendant et après vos séances cardio.")
    
    if any("strength" in session.category for session in sessions):
        recommendations.append("Consommez des protéines dans les 30 minutes après vos entraînements de force.")
    
    recommendations.append("Privilégiez les aliments locaux et de saison pour une meilleure récupération.")
    
    return recommendations

def generate_workout_notes(session_type: str, language: str) -> str:
    """Generate session-specific notes"""
    notes = {
        "fr": {
            "strength": "Concentrez-vous sur la technique. Respirez correctement pendant chaque exercice.",
            "cardio": "Maintenez un rythme constant. Écoutez votre corps et ajustez l'intensité.",
            "flexibility": "Ne forcez jamais les étirements. Respirez profondément et détendez-vous."
        },
        "en": {
            "strength": "Focus on technique. Breathe properly during each exercise.",
            "cardio": "Maintain a steady pace. Listen to your body and adjust intensity.",
            "flexibility": "Never force stretches. Breathe deeply and relax."
        }
    }
    
    return notes.get(language, notes["fr"]).get(session_type, "")

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    load_models()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": workout_model is not None
    }

@app.post("/generate-workout-plan", response_model=WorkoutPlanResponse)
async def generate_workout_plan_endpoint(request: WorkoutPlanRequest):
    """Generate personalized workout plan"""
    try:
        workout_plan = generate_workout_plan(request.user_profile, request)
        return workout_plan
    except Exception as e:
        logger.error(f"Error generating workout plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workout-recommendations")
async def get_workout_recommendations(user_profile: UserProfile):
    """Get personalized workout recommendations"""
    try:
        recommendations = []
        
        # Generate recommendations based on profile
        if "muscle_gain" in user_profile.fitness_goals:
            recommendations.append(WorkoutRecommendation(
                type="muscle_gain",
                title="Programme de Prise de Masse",
                description="Pour gagner du muscle efficacement, privilégiez les exercices composés et augmentez progressivement les charges.",
                confidence_score=0.85,
                actionable_items=[
                    "Faites 3-4 séances de force par semaine",
                    "Privilégiez les exercices composés (squats, deadlifts, bench press)",
                    "Augmentez progressivement les charges",
                    "Reposez-vous 48-72h entre les séances du même groupe musculaire"
                ],
                senegalese_context="Les exercices au poids du corps comme les pompes et les tractions sont excellents et ne nécessitent pas d'équipement coûteux."
            ))
        
        if "weight_loss" in user_profile.fitness_goals:
            recommendations.append(WorkoutRecommendation(
                type="weight_loss",
                title="Programme de Perte de Poids",
                description="Combinez entraînements cardio et force pour maximiser la perte de graisse.",
                confidence_score=0.80,
                actionable_items=[
                    "Faites 3-5 séances par semaine",
                    "Combinez cardio et force",
                    "Maintenez une intensité modérée à élevée",
                    "Surveillez votre alimentation"
                ],
                senegalese_context="La marche rapide et la course à pied sont excellentes et gratuites. Utilisez les escaliers au lieu de l'ascenseur."
            ))
        
        if "endurance" in user_profile.fitness_goals:
            recommendations.append(WorkoutRecommendation(
                type="endurance",
                title="Programme d'Endurance",
                description="Développez votre endurance cardiovasculaire avec des entraînements progressifs.",
                confidence_score=0.75,
                actionable_items=[
                    "Commencez par 20-30 minutes de cardio",
                    "Augmentez progressivement la durée",
                    "Variez les types d'activités",
                    "Incluez des séances de récupération"
                ],
                senegalese_context="La natation est excellente pour l'endurance et rafraîchissante au Sénégal."
            ))
        
        return {
            "user_id": user_profile.user_id,
            "recommendations": recommendations,
            "calculated_metrics": {
                "recommended_workouts_per_week": 3 if user_profile.fitness_level == "beginner" else 4,
                "recommended_session_duration": user_profile.time_availability,
                "estimated_weekly_calories": user_profile.time_availability * 5 * 3  # Rough estimate
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/exercises")
async def get_exercises(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    muscle_group: Optional[str] = None
):
    """Get exercise database with optional filtering"""
    if not exercise_database:
        raise HTTPException(status_code=404, detail="Exercise database not loaded")
    
    exercises = exercise_database
    
    if category:
        exercises = [ex for ex in exercises if ex.get("category") == category]
    
    if difficulty:
        exercises = [ex for ex in exercises if ex.get("difficulty_level") == difficulty]
    
    if muscle_group:
        exercises = [ex for ex in exercises if muscle_group in ex.get("muscle_groups", [])]
    
    return {"exercises": exercises}

@app.post("/exercise-search")
async def search_exercises(query: str, language: str = "fr"):
    """Search for exercises in the database"""
    if not exercise_database:
        raise HTTPException(status_code=404, detail="Exercise database not loaded")
    
    query_lower = query.lower()
    results = []
    
    for exercise in exercise_database:
        # Search in multiple languages
        searchable_text = [
            exercise.get("name", ""),
            exercise.get("name_fr", ""),
            exercise.get("name_wo", ""),
            exercise.get("category", ""),
            " ".join(exercise.get("muscle_groups", []))
        ]
        
        if any(query_lower in text.lower() for text in searchable_text if text):
            results.append(exercise)
    
    return {"results": results[:20]}  # Limit to 20 results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)