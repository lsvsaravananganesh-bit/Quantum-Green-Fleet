from app.core.database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False)  # truck/van/car/bus
    manufacturer = Column(String(100))
    model = Column(String(100))
    year = Column(Integer)
    fuel_type = Column(String(50), nullable=False)  # petrol/diesel/electric/hybrid
    engine_cc = Column(Float, default=1500.0)
    weight_kg = Column(Float, default=1500.0)
    tank_capacity_liters = Column(Float, default=50.0)
    baseline_mileage_kmpl = Column(Float, default=15.0)
    odometer_km = Column(Float, default=0.0)
    status = Column(String(50), default="available")  # available/in_use/maintenance/retired
    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    notes = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    trips = relationship("Trip", back_populates="vehicle", foreign_keys="Trip.vehicle_id")
    fuel_records = relationship("FuelRecord", back_populates="vehicle")
    assigned_driver = relationship("Driver", back_populates="assigned_vehicle", foreign_keys=[assigned_driver_id])
