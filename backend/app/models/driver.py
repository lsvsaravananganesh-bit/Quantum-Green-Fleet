from app.core.database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    license_number = Column(String(100), nullable=True)
    license_expiry = Column(Date, nullable=True)
    experience_years = Column(Integer, default=0)
    status = Column(String(50), default="active")  # active/inactive/on_leave
    total_trips = Column(Integer, default=0)
    total_distance_km = Column(Float, default=0.0)
    avg_fuel_efficiency = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assigned_vehicle = relationship(
        "Vehicle",
        back_populates="assigned_driver",
        foreign_keys="Vehicle.assigned_driver_id",
    )
    trips = relationship("Trip", back_populates="driver", foreign_keys="Trip.driver_id")
