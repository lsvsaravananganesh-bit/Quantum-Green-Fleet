from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


@router.get("")
def list_drivers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Driver).filter(Driver.is_active == True)
    if search:
        q = q.filter(
            Driver.full_name.ilike(f"%{search}%") |
            Driver.employee_id.ilike(f"%{search}%") |
            Driver.email.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Driver.status == status)
    total = q.count()
    drivers = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": [DriverOut.model_validate(d) for d in drivers],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("", response_model=DriverOut, status_code=status.HTTP_201_CREATED)
def create_driver(
    data: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Driver).filter(Driver.employee_id == data.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    driver = Driver(**data.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    d = db.query(Driver).filter(Driver.id == driver_id, Driver.is_active == True).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    return d


@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(
    driver_id: int,
    data: DriverUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(d, field, value)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    d.is_active = False
    db.commit()
    return {"message": "Driver deleted successfully"}
