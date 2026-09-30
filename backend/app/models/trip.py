from app.core.database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    trip_code = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    distance_km = Column(Float, nullable=False)
    scheduled_departure = Column(DateTime(timezone=True), nullable=True)
    actual_departure = Column(DateTime(timezone=True), nullable=True)
    scheduled_arrival = Column(DateTime(timezone=True), nullable=True)
    actual_arrival = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="planned")  # planned/active/completed/cancelled
    expected_fuel_liters = Column(Float, nullable=True)
    actual_fuel_liters = Column(Float, nullable=True)
    fuel_cost_inr = Column(Float, nullable=True)
    co2_emissions_kg = Column(Float, nullable=True)
    traffic_condition = Column(String(50), default="medium")  # low/medium/high
    weather_condition = Column(String(50), default="clear")
    payload_kg = Column(Float, default=0.0)
    avg_speed_kmh = Column(Float, nullable=True)
    idle_time_min = Column(Float, default=0.0)
    road_type = Column(String(50), default="mixed")  # highway/urban/mixed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vehicle = relationship("Vehicle", back_populates="trips", foreign_keys=[vehicle_id])
    driver = relationship("Driver", back_populates="trips", foreign_keys=[driver_id])
    fuel_records = relationship("FuelRecord", back_populates="trip")
