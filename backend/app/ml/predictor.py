"""
Fuel consumption predictor - loads trained model and runs inference.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Optional
from .trainer import (
    ALL_FEATURES, NUMERICAL_FEATURES, CATEGORICAL_FEATURES,
    compute_feature_importance
)

EMISSION_FACTORS = {
    "petrol": 2.31,
    "diesel": 2.68,
    "hybrid": 1.85,
    "electric": 0.0,
}

FUEL_PRICES_INR = {
    "petrol": 103.5,
    "diesel": 90.25,
    "electric": 8.0,
    "hybrid": 103.5,
}


class FuelPredictor:
    def __init__(self):
        self.pipeline = None
        self.model_version = "not_loaded"
        self.model_name = "none"
        self.models_dir = None
        self._loaded = False

    def load(self, models_dir: str) -> bool:
        self.models_dir = models_dir
        best_path = os.path.join(models_dir, "best_model.joblib")
        metrics_path = os.path.join(models_dir, "metrics.json")

        if not os.path.exists(best_path):
            return False

        try:
            self.pipeline = joblib.load(best_path)
            if os.path.exists(metrics_path):
                with open(metrics_path) as f:
                    m = json.load(f)
                self.model_name = m.get("best_model", "unknown")
                self.model_version = m.get("training_date", "1.0")[:10]
            self._loaded = True
            print(f"[OK] Model loaded: {self.model_name} ({self.model_version})")
            return True
        except Exception as e:
            print(f"[ERROR] Model load failed: {e}")
            return False

    def is_loaded(self) -> bool:
        return self._loaded

    def predict(self, features: dict) -> dict:
        if not self._loaded:
            raise RuntimeError("Model not loaded")

        # Build feature dataframe
        row = {
            "vehicle_type": features.get("vehicle_type", "car"),
            "fuel_type": features.get("fuel_type", "petrol"),
            "engine_cc": float(features.get("engine_cc", 1500)),
            "weight_kg": float(features.get("weight_kg", 1200)),
            "vehicle_age": int(features.get("vehicle_age", 3)),
            "distance_km": float(features.get("distance_km", 100)),
            "avg_speed_kmh": float(features.get("avg_speed_kmh", 60)),
            "idle_time_min": float(features.get("idle_time_min", 10)),
            "road_type": features.get("road_type", "mixed"),
            "traffic_condition": features.get("traffic_condition") or "medium",
            "temperature_c": float(features.get("temperature_c") if features.get("temperature_c") is not None else 25.0),
            "payload_kg": float(features.get("payload_kg") if features.get("payload_kg") is not None else 0.0),
            "driving_duration_min": float(
                features.get("driving_duration_min")
                if features.get("driving_duration_min") is not None
                else (float(features.get("distance_km") or 100) / max(float(features.get("avg_speed_kmh") or 60), 1) * 60)
            ),
        }

        df = pd.DataFrame([row])[ALL_FEATURES]
        pred = float(self.pipeline.predict(df)[0])
        pred = max(0.5, pred)  # physical minimum

        distance = row["distance_km"]
        fuel_type = row["fuel_type"]
        efficiency = round(distance / pred, 2) if pred > 0 else 0.0
        price = FUEL_PRICES_INR.get(fuel_type, 103.5)
        cost = round(pred * price, 2)
        co2 = round(pred * EMISSION_FACTORS.get(fuel_type, 2.31), 3)

        # Confidence interval (±10% from model uncertainty)
        margin = pred * 0.10

        feature_importance = []
        if self.models_dir:
            feature_importance = compute_feature_importance(self.model_name, self.models_dir)

        return {
            "predicted_fuel_liters": round(pred, 3),
            "predicted_efficiency_kmpl": efficiency,
            "predicted_cost_inr": cost,
            "predicted_co2_kg": co2,
            "confidence_lower": round(max(0, pred - margin), 3),
            "confidence_upper": round(pred + margin, 3),
            "feature_importance": feature_importance,
            "model_version": self.model_version,
            "model_name": self.model_name,
            "distance_km": distance,
            "fuel_type": fuel_type,
        }


# Singleton predictor instance
_predictor = FuelPredictor()


def get_predictor() -> FuelPredictor:
    return _predictor


def init_predictor(models_dir: str):
    """Called at app startup to load the model."""
    loaded = _predictor.load(models_dir)
    if not loaded:
        print("[WARN] No trained model found. Run 'python scripts/train_models.py' first.")
    return loaded
