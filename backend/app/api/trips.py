import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.trip import TripCreate, TripUpdate, TripOut
from app.core.config import settings

router = APIRouter(prefix="/api/trips", tags=["Trips"])

EMISSION_FACTORS = {
    "petrol": settings.PETROL_EMISSION_FACTOR,
    "diesel": settings.DIESEL_EMISSION_FACTOR,
    "hybrid": settings.HYBRID_EMISSION_FACTOR,
    "electric": 0.0,
}

FUEL_PRICES = {
    "petrol": settings.DEFAULT_PETROL_PRICE,
    "diesel": settings.DEFAULT_DIESEL_PRICE,
    "electric": settings.DEFAULT_ELECTRIC_PRICE_PER_KWH,
}


def generate_trip_code():
    return "TR-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def estimate_fuel(trip: Trip, vehicle: Vehicle) -> tuple:
    """Simple fuel estimation based on vehicle efficiency and trip conditions."""
    if not vehicle:
        return None, None, None

    traffic_factor = {"low": 0.9, "medium": 1.0, "high": 1.25}.get(trip.traffic_condition, 1.0)
    road_factor = {"highway": 0.9, "urban": 1.2, "mixed": 1.0}.get(trip.road_type, 1.0)
    payload_factor = 1.0 + (trip.payload_kg or 0) * 0.00003

    eff = (vehicle.baseline_mileage_kmpl or 15.0) / (traffic_factor * road_factor * payload_factor)
    fuel_liters = round(trip.distance_km / eff, 2) if eff > 0 else 0

    fuel_price = FUEL_PRICES.get(vehicle.fuel_type, 103.5)
    cost = round(fuel_liters * fuel_price, 2)
    co2 = round(fuel_liters * EMISSION_FACTORS.get(vehicle.fuel_type, 2.31), 2)

    return fuel_liters, cost, co2


@router.get("")
def list_trips(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Trip)
    if search:
        q = q.filter(
            Trip.trip_code.ilike(f"%{search}%") |
            Trip.origin.ilike(f"%{search}%") |
            Trip.destination.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Trip.status == status)
    if vehicle_id:
        q = q.filter(Trip.vehicle_id == vehicle_id)
    if driver_id:
        q = q.filter(Trip.driver_id == driver_id)

    total = q.count()
    trips = q.order_by(Trip.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": [TripOut.model_validate(t) for t in trips],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    data: TripCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trip_data = data.model_dump()
    if not trip_data.get("trip_code"):
        trip_data["trip_code"] = generate_trip_code()

    trip = Trip(**trip_data)

    # Auto-estimate fuel if vehicle assigned
    if trip.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        if vehicle:
            fuel, cost, co2 = estimate_fuel(trip, vehicle)
            trip.expected_fuel_liters = fuel
            trip.fuel_cost_inr = cost
            trip.co2_emissions_kg = co2

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t = db.query(Trip).filter(Trip.id == trip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    return t


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(
    trip_id: int,
    data: TripUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t = db.query(Trip).filter(Trip.id == trip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(t, field, value)

    # Recalculate fuel if status changed to completed
    if data.status == "completed" and data.actual_fuel_liters:
        vehicle = db.query(Vehicle).filter(Vehicle.id == t.vehicle_id).first()
        if vehicle:
            fuel_price = FUEL_PRICES.get(vehicle.fuel_type, 103.5)
            t.fuel_cost_inr = round(data.actual_fuel_liters * fuel_price, 2)
            t.co2_emissions_kg = round(
                data.actual_fuel_liters * EMISSION_FACTORS.get(vehicle.fuel_type, 2.31), 2
            )
            # Update driver stats
            if t.driver_id:
                driver = db.query(Driver).filter(Driver.id == t.driver_id).first()
                if driver:
                    driver.total_trips += 1
                    driver.total_distance_km += t.distance_km or 0
            # Update vehicle odometer
            if vehicle and t.distance_km:
                vehicle.odometer_km = (vehicle.odometer_km or 0) + t.distance_km

    db.commit()
    db.refresh(t)
    return t


@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t = db.query(Trip).filter(Trip.id == trip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    t.status = "cancelled"
    db.commit()
    return {"message": "Trip cancelled successfully"}
