from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel import FuelRecord, FuelPrice
from app.models.optimization import OptimizationRun
from app.models.prediction import PredictionRecord, Alert

__all__ = [
    "User", "Vehicle", "Driver", "Trip",
    "FuelRecord", "FuelPrice", "OptimizationRun",
    "PredictionRecord", "Alert"
]
