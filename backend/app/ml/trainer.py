"""
Model training pipeline for fuel consumption prediction.
Trains LinearRegression, RandomForest, GradientBoosting, XGBoost.
Selects best model by validation R².
"""
import os
import json
import shutil
from datetime import datetime
import numpy as np
import pandas as pd
import scipy.linalg
import joblib
import xgboost as xgb


CATEGORICAL_FEATURES = ["vehicle_type", "fuel_type", "road_type", "traffic_condition"]
NUMERICAL_FEATURES = [
    "engine_cc", "weight_kg", "vehicle_age", "distance_km",
    "avg_speed_kmh", "idle_time_min", "temperature_c",
    "payload_kg", "driving_duration_min",
]
TARGET = "fuel_consumed_liters"
ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES


class SimplePreprocessor:
    def __init__(self, num_cols, cat_cols):
        self.num_cols = num_cols
        self.cat_cols = cat_cols
        self.means = {}
        self.stds = {}
        self.categories = {}
        self.feature_names = []

    def fit(self, df: pd.DataFrame):
        for c in self.num_cols:
            vals = df[c].astype(float).values
            self.means[c] = float(np.mean(vals))
            std = float(np.std(vals))
            self.stds[c] = std if std > 1e-6 else 1.0

        self.feature_names = list(self.num_cols)
        for c in self.cat_cols:
            cats = sorted([str(x) for x in df[c].unique()])
            self.categories[c] = cats
            self.feature_names.extend([f"{c}_{cat}" for cat in cats])
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        parts = []
        for c in self.num_cols:
            vals = df[c].astype(float).values
            scaled = (vals - self.means[c]) / self.stds[c]
            parts.append(scaled.reshape(-1, 1))

        for c in self.cat_cols:
            vals = df[c].astype(str).values
            for cat in self.categories.get(c, []):
                col_match = (vals == cat).astype(float).reshape(-1, 1)
                parts.append(col_match)

        return np.hstack(parts)


class ModelPipeline:
    def __init__(self, preprocessor: SimplePreprocessor, model_type: str, model_obj, feature_names: list):
        self.preprocessor = preprocessor
        self.model_type = model_type
        self.model_obj = model_obj
        self.feature_names = feature_names

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        X = self.preprocessor.transform(df)
        if self.model_type == "linear_regression":
            X_b = np.hstack([np.ones((len(X), 1)), X])
            return X_b @ self.model_obj
        else:
            dmat = xgb.DMatrix(X, feature_names=self.feature_names)
            return self.model_obj.predict(dmat)

    @property
    def named_steps(self):
        return {"model": self}

    @property
    def feature_importances_(self):
        if self.model_type == "linear_regression":
            # Return magnitude of coefficients (excluding intercept)
            coefs = np.abs(self.model_obj[1:])
            total = float(np.sum(coefs)) or 1.0
            return (coefs / total).tolist()
        else:
            score_dict = self.model_obj.get_score(importance_type="gain")
            total = sum(score_dict.values()) or 1.0
            return [score_dict.get(fn, 0.0) / total for fn in self.feature_names]


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    ss_res = float(np.sum((y_true - y_pred) ** 2))
    ss_tot = float(np.sum((y_true - np.mean(y_true)) ** 2))
    r2 = float(1.0 - (ss_res / (ss_tot + 1e-9)))

    mask = y_true > 0.5
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100) if mask.sum() > 0 else 0.0
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "mape": round(mape, 2),
    }


def train_models(df: pd.DataFrame, models_dir: str) -> dict:
    os.makedirs(models_dir, exist_ok=True)

    n = len(df)
    indices = np.arange(n)
    np.random.seed(42)
    np.random.shuffle(indices)

    train_end = int(0.70 * n)
    val_end = int(0.85 * n)

    train_idx = indices[:train_end]
    val_idx = indices[train_end:val_end]
    test_idx = indices[val_end:]

    df_train = df.iloc[train_idx].copy().reset_index(drop=True)
    df_val = df.iloc[val_idx].copy().reset_index(drop=True)
    df_test = df.iloc[test_idx].copy().reset_index(drop=True)

    y_train = df_train[TARGET].values.astype(float)
    y_val = df_val[TARGET].values.astype(float)
    y_test = df_test[TARGET].values.astype(float)

    print(f"Train: {len(df_train)}, Val: {len(df_val)}, Test: {len(df_test)}")

    preprocessor = SimplePreprocessor(NUMERICAL_FEATURES, CATEGORICAL_FEATURES)
    preprocessor.fit(df_train)

    X_train = preprocessor.transform(df_train)
    X_val = preprocessor.transform(df_val)
    X_test = preprocessor.transform(df_test)
    feature_names = preprocessor.feature_names

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=feature_names)
    dval = xgb.DMatrix(X_val, label=y_val, feature_names=feature_names)
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=feature_names)

    # 1. Linear Regression
    X_b_train = np.hstack([np.ones((len(X_train), 1)), X_train])
    X_b_val = np.hstack([np.ones((len(X_val), 1)), X_val])
    X_b_test = np.hstack([np.ones((len(X_test), 1)), X_test])
    w, _, _, _ = scipy.linalg.lstsq(X_b_train, y_train)

    pred_val_lr = X_b_val @ w
    pred_test_lr = X_b_test @ w

    # 2. XGBoost Gradient Boosting
    xgb_params = {
        "max_depth": 5,
        "eta": 0.08,
        "objective": "reg:squarederror",
        "seed": 42,
        "nthread": 1,
    }
    bst_xgb = xgb.train(xgb_params, dtrain, num_boost_round=120)
    pred_val_xgb = bst_xgb.predict(dval)
    pred_test_xgb = bst_xgb.predict(dtest)

    # 3. Random Forest (via XGBoost parallel trees)
    rf_params = {
        "max_depth": 8,
        "eta": 1.0,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "objective": "reg:squarederror",
        "num_parallel_tree": 50,
        "seed": 42,
        "nthread": 1,
    }
    bst_rf = xgb.train(rf_params, dtrain, num_boost_round=1)
    pred_val_rf = bst_rf.predict(dval)
    pred_test_rf = bst_rf.predict(dtest)

    # 4. Gradient Boosting Regressor (shallower, smaller learning rate)
    gb_params = {
        "max_depth": 4,
        "eta": 0.05,
        "objective": "reg:squarederror",
        "subsample": 0.9,
        "seed": 42,
        "nthread": 1,
    }
    bst_gb = xgb.train(gb_params, dtrain, num_boost_round=100)
    pred_val_gb = bst_gb.predict(dval)
    pred_test_gb = bst_gb.predict(dtest)

    model_results = {
        "linear_regression": {
            "val": compute_metrics(y_val, pred_val_lr),
            "test": compute_metrics(y_test, pred_test_lr),
            "pipeline": ModelPipeline(preprocessor, "linear_regression", w, feature_names),
        },
        "xgboost": {
            "val": compute_metrics(y_val, pred_val_xgb),
            "test": compute_metrics(y_test, pred_test_xgb),
            "pipeline": ModelPipeline(preprocessor, "xgboost", bst_xgb, feature_names),
        },
        "random_forest": {
            "val": compute_metrics(y_val, pred_val_rf),
            "test": compute_metrics(y_test, pred_test_rf),
            "pipeline": ModelPipeline(preprocessor, "random_forest", bst_rf, feature_names),
        },
        "gradient_boosting": {
            "val": compute_metrics(y_val, pred_val_gb),
            "test": compute_metrics(y_test, pred_test_gb),
            "pipeline": ModelPipeline(preprocessor, "gradient_boosting", bst_gb, feature_names),
        },
    }

    results = {}
    best_model_name = None
    best_val_r2 = -999.0

    for name, info in model_results.items():
        val_m = info["val"]
        test_m = info["test"]
        print(f"\n{name}:")
        print(f"  Val  R2={val_m['r2']:.4f} MAE={val_m['mae']:.3f}")
        print(f"  Test R2={test_m['r2']:.4f} MAE={test_m['mae']:.3f}")

        results[name] = {
            "val": val_m,
            "test": test_m,
            "is_selected": False,
        }

        # Save pipeline
        model_path = os.path.join(models_dir, f"{name}.joblib")
        joblib.dump(info["pipeline"], model_path)

        if val_m["r2"] > best_val_r2:
            best_val_r2 = val_m["r2"]
            best_model_name = name

    results[best_model_name]["is_selected"] = True
    best_src = os.path.join(models_dir, f"{best_model_name}.joblib")
    best_dst = os.path.join(models_dir, "best_model.joblib")
    shutil.copy2(best_src, best_dst)

    # Save feature names
    feature_names_path = os.path.join(models_dir, "feature_names.json")
    with open(feature_names_path, "w") as f:
        json.dump(feature_names, f)

    # Save metrics
    metrics_data = {
        "best_model": best_model_name,
        "training_date": datetime.utcnow().isoformat(),
        "dataset_size": len(df),
        "train_size": len(df_train),
        "val_size": len(df_val),
        "test_size": len(df_test),
        "features": ALL_FEATURES,
        "models": results,
    }
    metrics_path = os.path.join(models_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"\n[OK] Best model: {best_model_name} (Val R2={best_val_r2:.4f})")
    print(f"[OK] Models saved to {models_dir}")
    return metrics_data


def compute_feature_importance(model_name: str, models_dir: str) -> list:
    """Extract feature importance from the best model."""
    try:
        model_path = os.path.join(models_dir, f"{model_name}.joblib")
        if not os.path.exists(model_path):
            model_path = os.path.join(models_dir, "best_model.joblib")

        pipeline = joblib.load(model_path)
        feature_names = getattr(pipeline, "feature_names", ALL_FEATURES)
        importances = getattr(pipeline, "feature_importances_", None)

        if importances is None:
            return []

        if len(importances) != len(feature_names):
            feature_names = [f"feature_{i}" for i in range(len(importances))]

        importance_list = sorted(
            [
                {"feature": str(n), "importance": round(float(v), 4)}
                for n, v in zip(feature_names, importances)
            ],
            key=lambda x: x["importance"],
            reverse=True,
        )[:15]
        return importance_list
    except Exception as e:
        print(f"Feature importance error: {e}")
        return []
