from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


@router.get("")
def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    fuel_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Vehicle).filter(Vehicle.is_active == True)
    if search:
        q = q.filter(
            Vehicle.registration_number.ilike(f"%{search}%") |
            Vehicle.manufacturer.ilike(f"%{search}%") |
            Vehicle.model.ilike(f"%{search}%")
        )
    if vehicle_type:
        q = q.filter(Vehicle.vehicle_type == vehicle_type)
    if fuel_type:
        q = q.filter(Vehicle.fuel_type == fuel_type)
    if status:
        q = q.filter(Vehicle.status == status)

    total = q.count()
    vehicles = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": [VehicleOut.model_validate(v) for v in vehicles],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Vehicle).filter(Vehicle.registration_number == data.registration_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Registration number already exists")
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.is_active == True).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(v, field, value)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    v.is_active = False
    db.commit()
    return {"message": "Vehicle deleted successfully"}
