from app.core.database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=True)
    model_version = Column(String(100), nullable=True)
    model_name = Column(String(100), nullable=True)
    input_features_json = Column(Text, nullable=True)
    predicted_fuel_liters = Column(Float, nullable=False)
    predicted_efficiency_kmpl = Column(Float, nullable=True)
    predicted_cost_inr = Column(Float, nullable=True)
    predicted_co2_kg = Column(Float, nullable=True)
    confidence_lower = Column(Float, nullable=True)
    confidence_upper = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(50), default="warning")  # info/warning/critical
    vehicle_id = Column(Integer, nullable=True)
    trip_id = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, default=0)
    is_resolved = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
