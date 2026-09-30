"""
Adaptive Machine Learning, Feature Drift & Model Registry Engine.
Monitors:
1. Residual Drift: y_actual - y_pred over rolling windows (20, 50, 100 trips).
2. Population Stability Index (PSI) for critical inference features (cargo weight, distance, temperature).
3. Automated Drift Alerts (MAE increase > 25% or PSI > 0.25).
4. Champion-Challenger Model Registry with gated promotion and rollback.
"""
import time
import math
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
import numpy as np


@dataclass
class PSIMetric:
    feature_name: str
    psi_value: float
    drift_status: str  # "No Drift" (<0.10), "Moderate Drift" (0.10 - 0.25), "Significant Drift" (>0.25)
    baseline_mean: float
    current_mean: float


@dataclass
class ModelVersion:
    version_id: str
    model_name: str
    algorithm: str
    status: str       # "Champion", "Challenger", "Archived", "Candidate"
    r2_score: float
    mae_liters: float
    rmse_liters: float
    training_samples: int
    created_at: str
    is_active_champion: bool


@dataclass
class DriftReport:
    timestamp: str
    total_trips_monitored: int
    rolling_mae_20: float
    rolling_mae_50: float
    baseline_mae: float
    mae_drift_pct: float
    drift_detected: bool
    drift_severity: str     # "Normal", "Warning", "Critical"
    psi_metrics: List[PSIMetric]
    residual_distribution: List[Dict[str, float]]
    active_champion: ModelVersion
    available_challengers: List[ModelVersion]
    recommendations: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "total_trips_monitored": self.total_trips_monitored,
            "rolling_mae_20": round(self.rolling_mae_20, 3),
            "rolling_mae_50": round(self.rolling_mae_50, 3),
            "baseline_mae": round(self.baseline_mae, 3),
            "mae_drift_pct": round(self.mae_drift_pct, 1),
            "drift_detected": self.drift_detected,
            "drift_severity": self.drift_severity,
            "psi_metrics": [asdict(p) for p in self.psi_metrics],
            "residual_distribution": self.residual_distribution,
            "active_champion": asdict(self.active_champion),
            "available_challengers": [asdict(c) for c in self.available_challengers],
            "recommendations": self.recommendations,
        }


def compute_psi(expected: np.ndarray, actual: np.ndarray, num_bins: int = 10) -> float:
    """Calculate Population Stability Index (PSI) between baseline and live distributions."""
    if len(expected) == 0 or len(actual) == 0:
        return 0.0

    # Determine bin edges from expected
    percentiles = np.linspace(0, 100, num_bins + 1)
    bin_edges = np.percentile(expected, percentiles)
    bin_edges[0] -= 1e-5
    bin_edges[-1] += 1e-5

    # Counts
    expected_counts, _ = np.histogram(expected, bins=bin_edges)
    actual_counts, _ = np.histogram(actual, bins=bin_edges)

    # Fractions with smoothing epsilon
    eps = 1e-4
    expected_pct = (expected_counts / len(expected)) + eps
    actual_pct = (actual_counts / len(actual)) + eps

    psi = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(max(0.0, psi))


class DriftMonitor:
    """Continual learning and model reliability supervisor."""

    def __init__(self):
        # In-memory model registry
        self.registry: List[ModelVersion] = [
            ModelVersion(
                version_id="MOD-v1.0-CHAMP",
                model_name="XGBoost Production Champion",
                algorithm="xgboost",
                status="Champion",
                r2_score=0.9711,
                mae_liters=15.388,
                rmse_liters=21.402,
                training_samples=3000,
                created_at="2026-03-15",
                is_active_champion=True,
            ),
            ModelVersion(
                version_id="MOD-v1.1-CHALL",
                model_name="Gradient Boosting Challenger",
                algorithm="gradient_boosting",
                status="Challenger",
                r2_score=0.9685,
                mae_liters=15.820,
                rmse_liters=22.110,
                training_samples=3500,
                created_at="2026-03-24",
                is_active_champion=False,
            ),
            ModelVersion(
                version_id="MOD-v1.2-CAND",
                model_name="Adaptive Retrained Hybrid",
                algorithm="xgboost",
                status="Candidate",
                r2_score=0.9782,
                mae_liters=14.150,
                rmse_liters=19.820,
                training_samples=4200,
                created_at="2026-03-30",
                is_active_champion=False,
            ),
        ]

    def promote_model(self, version_id: str) -> Dict[str, Any]:
        """Promote a candidate/challenger to Champion if gated conditions pass."""
        target = None
        current_champ = None
        for m in self.registry:
            if m.is_active_champion:
                current_champ = m
            if m.version_id == version_id:
                target = m

        if not target:
            return {"success": False, "message": f"Model {version_id} not found."}

        if target.is_active_champion:
            return {"success": True, "message": "Model is already the active Champion."}

        # Gated promotion check: target MAE must not exceed Champion MAE + 5%
        if current_champ and target.mae_liters > current_champ.mae_liters * 1.05:
            return {
                "success": False,
                "message": f"Promotion blocked: Candidate MAE ({target.mae_liters:.2f}L) regresses beyond current Champion ({current_champ.mae_liters:.2f}L).",
            }

        if current_champ:
            current_champ.is_active_champion = False
            current_champ.status = "Archived"

        target.is_active_champion = True
        target.status = "Champion"

        return {
            "success": True,
            "message": f"Successfully promoted {target.model_name} ({target.version_id}) to production Champion!",
            "active_champion": asdict(target),
        }

    def rollback_model(self) -> Dict[str, Any]:
        """Rolls back to the most recent previous stable model."""
        archived = [m for m in self.registry if m.status == "Archived"]
        if not archived:
            return {"success": False, "message": "No archived model version available for rollback."}

        prev = archived[-1]
        return self.promote_model(prev.version_id)

    def generate_drift_report(self) -> DriftReport:
        rng = np.random.default_rng(42)

        # Baseline distributions (from training data)
        base_dist = rng.normal(loc=120.0, scale=35.0, size=1000)
        base_payload = rng.normal(loc=1200.0, scale=450.0, size=1000)
        base_temp = rng.normal(loc=26.0, scale=5.0, size=1000)

        # Current live telemetry (simulating slight seasonal heat & payload increase)
        live_dist = rng.normal(loc=124.0, scale=36.0, size=200)
        live_payload = rng.normal(loc=1350.0, scale=480.0, size=200)  # Slight shift
        live_temp = rng.normal(loc=31.0, scale=6.0, size=200)         # Summer shift

        # Compute PSI
        psi_dist = compute_psi(base_dist, live_dist)
        psi_payload = compute_psi(base_payload, live_payload)
        psi_temp = compute_psi(base_temp, live_temp)

        def psi_status(v: float) -> str:
            if v < 0.10:
                return "No Drift"
            elif v < 0.25:
                return "Moderate Drift"
            else:
                return "Significant Drift"

        psi_items = [
            PSIMetric("Trip Distance (km)", round(psi_dist, 3), psi_status(psi_dist), float(np.mean(base_dist)), float(np.mean(live_dist))),
            PSIMetric("Payload Weight (kg)", round(psi_payload, 3), psi_status(psi_payload), float(np.mean(base_payload)), float(np.mean(live_payload))),
            PSIMetric("Ambient Temperature (°C)", round(psi_temp, 3), psi_status(psi_temp), float(np.mean(base_temp)), float(np.mean(live_temp))),
        ]

        # Residuals: actual - predicted
        residuals = rng.normal(loc=1.2, scale=14.5, size=50)
        residuals_list = [{"trip_idx": i + 1, "residual_liters": round(float(r), 2)} for i, r in enumerate(residuals)]

        base_mae = 15.388
        rolling_20 = float(np.mean(np.abs(residuals[-20:])))
        rolling_50 = float(np.mean(np.abs(residuals)))

        mae_drift_pct = ((rolling_20 - base_mae) / base_mae) * 100.0
        drift_detected = mae_drift_pct > 25.0 or any(p.drift_status == "Significant Drift" for p in psi_items)

        severity = "Critical" if mae_drift_pct > 30.0 else ("Warning" if mae_drift_pct > 15.0 or any(p.drift_status == "Moderate Drift" for p in psi_items) else "Normal")

        champ = next(m for m in self.registry if m.is_active_champion)
        challengers = [m for m in self.registry if not m.is_active_champion]

        recs = []
        if any(p.drift_status == "Moderate Drift" for p in psi_items):
            recs.append("Moderate distribution shift observed in Ambient Temperature (+5°C summer surge).")
        if rolling_20 > base_mae * 1.1:
            recs.append(f"Recent 20-trip MAE ({rolling_20:.2f}L) is {mae_drift_pct:+.1f}% vs baseline. Consider promoting Challenger model.")
        if not recs:
            recs.append("Inference distributions and residual tolerances are fully aligned with baseline training envelopes.")

        return DriftReport(
            timestamp="2026-03-30T10:00:00Z",
            total_trips_monitored=len(residuals),
            rolling_mae_20=rolling_20,
            rolling_mae_50=rolling_50,
            baseline_mae=base_mae,
            mae_drift_pct=mae_drift_pct,
            drift_detected=drift_detected,
            drift_severity=severity,
            psi_metrics=psi_items,
            residual_distribution=residuals_list,
            active_champion=champ,
            available_challengers=challengers,
            recommendations=recs,
        )


_drift_monitor = DriftMonitor()

def get_drift_monitor() -> DriftMonitor:
    return _drift_monitor
