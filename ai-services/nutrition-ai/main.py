#!/usr/bin/env python3
"""
Arcadis Fit - AI Nutrition Service
AI-powered nutrition and meal planning service with Senegalese diet focus
"""

import os
import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, date
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
    title="Arcadis Fit Nutrition AI",
    description="AI-powered nutrition and meal planning service for Senegal",
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
nutrition_model = None
food_database = None
senegalese_foods = None
scaler = None
label_encoders = {}

class UserProfile(BaseModel):
    """User profile for nutrition planning"""
    user_id: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    activity_level: str = Field(..., description="sedentary, light, moderate, active, very_active")
    fitness_goals: List[str] = Field(..., description="weight_loss, muscle_gain, maintenance, etc.")
    dietary_restrictions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    language: str = "fr"

class MealPlanRequest(BaseModel):
    """Request for meal plan generation"""
    user_profile: UserProfile
    target_calories: Optional[int] = None
    target_protein: Optional[int] = None
    target_carbs: Optional[int] = None
    target_fat: Optional[int] = None
    days: int = 7
    include_senegalese: bool = True
    meal_types: List[str] = Field(default_factory=lambda: ["breakfast", "lunch", "dinner", "snack"])

class FoodItem(BaseModel):
    """Food item model"""
    id: str
    name: str
    name_fr: Optional[str] = None
    name_wo: Optional[str] = None
    category: str
    is_senegalese: bool = False
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    fiber_per_100g: Optional[float] = None
    sugar_per_100g: Optional[float] = None
    sodium_per_100g: Optional[float] = None
    vitamins: Optional[Dict[str, float]] = None
    minerals: Optional[Dict[str, float]] = None
    allergens: Optional[List[str]] = None

class Recipe(BaseModel):
    """Recipe model"""
    id: str
    name: str
    name_fr: Optional[str] = None
    name_wo: Optional[str] = None
    description: Optional[str] = None
    category: str
    cuisine_type: str
    is_senegalese: bool = False
    difficulty_level: str
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int
    calories_per_serving: float
    protein_per_serving: float
    carbs_per_serving: float
    fat_per_serving: float
    instructions: List[str]
    ingredients: List[Dict[str, Any]]
    tags: List[str]
    image_url: Optional[str] = None

class MealPlanResponse(BaseModel):
    """Response for meal plan generation"""
    user_id: str
    start_date: date
    end_date: date
    target_calories: int
    target_protein: int
    target_carbs: int
    target_fat: int
    meals: List[Dict[str, Any]]
    total_cost_xof: Optional[float] = None
    shopping_list: Optional[List[Dict[str, Any]]] = None
    nutrition_summary: Dict[str, Any]

class NutritionRecommendation(BaseModel):
    """Nutrition recommendation"""
    type: str
    title: str
    description: str
    confidence_score: float
    actionable_items: List[str]
    senegalese_context: Optional[str] = None

def load_models():
    """Load AI models and data"""
    global nutrition_model, food_database, senegalese_foods, scaler, label_encoders
    
    try:
        # Load nutrition recommendation model
        model_path = os.getenv("NUTRITION_MODEL_PATH", "models/nutrition_recommendation_model.h5")
        if os.path.exists(model_path):
            nutrition_model = keras.models.load_model(model_path)
            logger.info("Nutrition model loaded successfully")
        
        # Load food database
        food_db_path = os.getenv("FOOD_DATABASE_PATH", "data/food_database.json")
        if os.path.exists(food_db_path):
            with open(food_db_path, 'r', encoding='utf-8') as f:
                food_database = json.load(f)
            logger.info("Food database loaded successfully")
        
        # Load Senegalese foods specifically
        senegalese_path = os.getenv("SENEGALESE_FOODS_PATH", "data/senegalese_foods.json")
        if os.path.exists(senegalese_path):
            with open(senegalese_path, 'r', encoding='utf-8') as f:
                senegalese_foods = json.load(f)
            logger.info("Senegalese foods database loaded successfully")
        
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

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
    if gender.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    return bmr

def calculate_tdee(bmr: float, activity_level: str) -> float:
    """Calculate Total Daily Energy Expenditure"""
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    return bmr * activity_multipliers.get(activity_level.lower(), 1.2)

def calculate_macro_targets(calories: int, goals: List[str]) -> Dict[str, int]:
    """Calculate macronutrient targets based on goals"""
    if "weight_loss" in goals:
        protein_ratio = 0.35  # Higher protein for satiety
        fat_ratio = 0.30
        carbs_ratio = 0.35
    elif "muscle_gain" in goals:
        protein_ratio = 0.30
        fat_ratio = 0.25
        carbs_ratio = 0.45  # Higher carbs for energy
    else:  # maintenance
        protein_ratio = 0.25
        fat_ratio = 0.30
        carbs_ratio = 0.45
    
    protein_cals = calories * protein_ratio
    fat_cals = calories * fat_ratio
    carbs_cals = calories * carbs_ratio
    
    return {
        "protein": int(protein_cals / 4),  # 4 cal/g
        "fat": int(fat_cals / 9),          # 9 cal/g
        "carbs": int(carbs_cals / 4)       # 4 cal/g
    }

def get_senegalese_food_suggestions(meal_type: str, target_calories: int) -> List[Dict[str, Any]]:
    """Get Senegalese food suggestions for meal planning"""
    if not senegalese_foods:
        return []
    
    suggestions = []
    for food in senegalese_foods:
        if food.get("is_senegalese", False):
            # Calculate appropriate portion size
            calories_per_100g = food.get("calories_per_100g", 0)
            if calories_per_100g > 0:
                portion_g = min(300, target_calories / calories_per_100g * 100)
                food_copy = food.copy()
                food_copy["suggested_portion_g"] = portion_g
                food_copy["estimated_calories"] = (portion_g / 100) * calories_per_100g
                suggestions.append(food_copy)
    
    # Sort by relevance to meal type
    meal_keywords = {
        "breakfast": ["céréale", "lait", "pain", "œuf", "fruit"],
        "lunch": ["riz", "poisson", "viande", "légume", "sauce"],
        "dinner": ["poisson", "viande", "légume", "soupe"],
        "snack": ["fruit", "noix", "yogourt", "pain"]
    }
    
    keywords = meal_keywords.get(meal_type, [])
    suggestions.sort(key=lambda x: sum(1 for kw in keywords if kw.lower() in x.get("name_fr", "").lower()), reverse=True)
    
    return suggestions[:10]  # Return top 10 suggestions

def generate_meal_plan(user_profile: UserProfile, request: MealPlanRequest) -> MealPlanResponse:
    """Generate personalized meal plan"""
    
    # Calculate calorie needs
    bmr = calculate_bmr(user_profile.weight_kg, user_profile.height_cm, user_profile.age, user_profile.gender)
    tdee = calculate_tdee(bmr, user_profile.activity_level)
    
    # Adjust calories based on goals
    if "weight_loss" in user_profile.fitness_goals:
        target_calories = tdee - 500  # 500 calorie deficit
    elif "muscle_gain" in user_profile.fitness_goals:
        target_calories = tdee + 300  # 300 calorie surplus
    else:
        target_calories = tdee
    
    # Override if specified in request
    if request.target_calories:
        target_calories = request.target_calories
    
    # Calculate macro targets
    macro_targets = calculate_macro_targets(target_calories, user_profile.fitness_goals)
    
    # Override macros if specified
    if request.target_protein:
        macro_targets["protein"] = request.target_protein
    if request.target_carbs:
        macro_targets["carbs"] = request.target_carbs
    if request.target_fat:
        macro_targets["fat"] = request.target_fat
    
    # Generate meals for each day
    meals = []
    start_date = date.today()
    
    for day in range(request.days):
        day_date = start_date + pd.Timedelta(days=day)
        day_meals = []
        
        for meal_type in request.meal_types:
            # Calculate meal calories (rough distribution)
            meal_calorie_ratios = {
                "breakfast": 0.25,
                "lunch": 0.35,
                "dinner": 0.30,
                "snack": 0.10
            }
            
            meal_calories = target_calories * meal_calorie_ratios.get(meal_type, 0.25)
            
            # Get food suggestions
            if request.include_senegalese:
                suggestions = get_senegalese_food_suggestions(meal_type, meal_calories)
            else:
                suggestions = []  # Use general food database
            
            # Create meal
            meal = {
                "date": day_date.isoformat(),
                "meal_type": meal_type,
                "target_calories": meal_calories,
                "foods": suggestions[:3],  # Top 3 suggestions
                "total_calories": sum(f.get("estimated_calories", 0) for f in suggestions[:3]),
                "notes": generate_meal_notes(meal_type, user_profile.language)
            }
            
            day_meals.append(meal)
        
        meals.extend(day_meals)
    
    # Generate shopping list
    shopping_list = generate_shopping_list(meals)
    
    # Calculate total cost (rough estimate in XOF)
    total_cost = calculate_estimated_cost(shopping_list)
    
    # Generate nutrition summary
    nutrition_summary = generate_nutrition_summary(meals, macro_targets)
    
    return MealPlanResponse(
        user_id=user_profile.user_id,
        start_date=start_date,
        end_date=start_date + pd.Timedelta(days=request.days - 1),
        target_calories=target_calories,
        target_protein=macro_targets["protein"],
        target_carbs=macro_targets["carbs"],
        target_fat=macro_targets["fat"],
        meals=meals,
        total_cost_xof=total_cost,
        shopping_list=shopping_list,
        nutrition_summary=nutrition_summary
    )

def generate_meal_notes(meal_type: str, language: str) -> str:
    """Generate meal-specific notes"""
    notes = {
        "fr": {
            "breakfast": "Prenez votre temps pour bien mâcher. Buvez de l'eau ou du thé vert.",
            "lunch": "Évitez de manger trop rapidement. Privilégiez les légumes locaux.",
            "dinner": "Dînez au moins 2 heures avant le coucher. Portions modérées.",
            "snack": "Choisissez des collations saines comme les fruits locaux."
        },
        "en": {
            "breakfast": "Take your time to chew well. Drink water or green tea.",
            "lunch": "Avoid eating too quickly. Prioritize local vegetables.",
            "dinner": "Dine at least 2 hours before bedtime. Moderate portions.",
            "snack": "Choose healthy snacks like local fruits."
        }
    }
    
    return notes.get(language, notes["fr"]).get(meal_type, "")

def generate_shopping_list(meals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate shopping list from meal plan"""
    shopping_items = {}
    
    for meal in meals:
        for food in meal.get("foods", []):
            food_name = food.get("name_fr", food.get("name", ""))
            portion = food.get("suggested_portion_g", 0)
            
            if food_name in shopping_items:
                shopping_items[food_name]["total_grams"] += portion
            else:
                shopping_items[food_name] = {
                    "name": food_name,
                    "category": food.get("category", ""),
                    "total_grams": portion,
                    "estimated_cost_xof": estimate_food_cost(food_name, portion)
                }
    
    return list(shopping_items.values())

def estimate_food_cost(food_name: str, grams: float) -> float:
    """Estimate food cost in XOF (rough estimates for Senegal)"""
    # This would be replaced with actual market data
    cost_per_kg = {
        "riz": 500,  # 500 XOF per kg
        "poisson": 2000,  # 2000 XOF per kg
        "poulet": 1500,  # 1500 XOF per kg
        "légumes": 800,  # 800 XOF per kg
        "fruits": 1000,  # 1000 XOF per kg
    }
    
    # Find matching category
    for category, cost in cost_per_kg.items():
        if category.lower() in food_name.lower():
            return (grams / 1000) * cost
    
    return (grams / 1000) * 1000  # Default 1000 XOF per kg

def calculate_estimated_cost(shopping_list: List[Dict[str, Any]]) -> float:
    """Calculate total estimated cost"""
    return sum(item.get("estimated_cost_xof", 0) for item in shopping_list)

def generate_nutrition_summary(meals: List[Dict[str, Any]], targets: Dict[str, int]) -> Dict[str, Any]:
    """Generate nutrition summary"""
    total_calories = sum(meal.get("total_calories", 0) for meal in meals)
    avg_daily_calories = total_calories / (len(meals) / len(set(meal["date"] for meal in meals)))
    
    return {
        "average_daily_calories": avg_daily_calories,
        "target_calories": targets.get("protein", 0) * 4 + targets.get("carbs", 0) * 4 + targets.get("fat", 0) * 9,
        "calorie_deficit": targets.get("protein", 0) * 4 + targets.get("carbs", 0) * 4 + targets.get("fat", 0) * 9 - avg_daily_calories,
        "macro_targets": targets,
        "recommendations": generate_nutrition_recommendations(avg_daily_calories, targets)
    }

def generate_nutrition_recommendations(calories: float, targets: Dict[str, int]) -> List[str]:
    """Generate nutrition recommendations"""
    recommendations = []
    
    if calories < 1200:
        recommendations.append("Considérez augmenter légèrement votre apport calorique pour maintenir votre métabolisme.")
    
    if targets.get("protein", 0) < 80:
        recommendations.append("Augmentez votre apport en protéines pour soutenir la récupération musculaire.")
    
    recommendations.append("Buvez au moins 2 litres d'eau par jour.")
    recommendations.append("Privilégiez les aliments locaux et de saison.")
    
    return recommendations

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
        "models_loaded": nutrition_model is not None
    }

@app.post("/generate-meal-plan", response_model=MealPlanResponse)
async def generate_meal_plan_endpoint(request: MealPlanRequest):
    """Generate personalized meal plan"""
    try:
        meal_plan = generate_meal_plan(request.user_profile, request)
        return meal_plan
    except Exception as e:
        logger.error(f"Error generating meal plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nutrition-recommendations")
async def get_nutrition_recommendations(user_profile: UserProfile):
    """Get personalized nutrition recommendations"""
    try:
        recommendations = []
        
        # Calculate basic metrics
        bmr = calculate_bmr(user_profile.weight_kg, user_profile.height_cm, user_profile.age, user_profile.gender)
        tdee = calculate_tdee(bmr, user_profile.activity_level)
        
        # Generate recommendations based on profile
        if "weight_loss" in user_profile.fitness_goals:
            recommendations.append(NutritionRecommendation(
                type="weight_loss",
                title="Stratégie de perte de poids",
                description="Pour perdre du poids de manière saine, créez un déficit calorique de 300-500 calories par jour.",
                confidence_score=0.85,
                actionable_items=[
                    "Réduisez progressivement votre apport calorique",
                    "Augmentez votre consommation de protéines",
                    "Privilégiez les légumes locaux",
                    "Évitez les boissons sucrées"
                ],
                senegalese_context="Intégrez des plats traditionnels comme le thiéboudienne avec moins de riz et plus de légumes."
            ))
        
        if "muscle_gain" in user_profile.fitness_goals:
            recommendations.append(NutritionRecommendation(
                type="muscle_gain",
                title="Stratégie de prise de masse musculaire",
                description="Pour gagner du muscle, augmentez votre apport en protéines et calories.",
                confidence_score=0.80,
                actionable_items=[
                    "Consommez 1.6-2.2g de protéines par kg de poids corporel",
                    "Augmentez votre apport calorique de 200-300 calories",
                    "Mangez des repas équilibrés toutes les 3-4 heures",
                    "Incluez des glucides complexes"
                ],
                senegalese_context="Le poisson local est excellent pour les protéines. Considérez le thiof ou le capitaine."
            ))
        
        return {
            "user_id": user_profile.user_id,
            "recommendations": recommendations,
            "calculated_metrics": {
                "bmr": bmr,
                "tdee": tdee,
                "bmi": user_profile.weight_kg / ((user_profile.height_cm / 100) ** 2)
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/senegalese-foods")
async def get_senegalese_foods(category: Optional[str] = None):
    """Get Senegalese food database"""
    if not senegalese_foods:
        raise HTTPException(status_code=404, detail="Senegalese foods database not loaded")
    
    if category:
        filtered_foods = [food for food in senegalese_foods if food.get("category") == category]
        return {"foods": filtered_foods}
    
    return {"foods": senegalese_foods}

@app.post("/food-search")
async def search_foods(query: str, language: str = "fr"):
    """Search for foods in the database"""
    if not food_database:
        raise HTTPException(status_code=404, detail="Food database not loaded")
    
    query_lower = query.lower()
    results = []
    
    for food in food_database:
        # Search in multiple languages
        searchable_text = [
            food.get("name", ""),
            food.get("name_fr", ""),
            food.get("name_wo", ""),
            food.get("category", "")
        ]
        
        if any(query_lower in text.lower() for text in searchable_text if text):
            results.append(food)
    
    return {"results": results[:20]}  # Limit to 20 results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)