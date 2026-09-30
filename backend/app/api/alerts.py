from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.prediction import Alert

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: str = None,
    is_read: int = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Alert)
    if severity:
        q = q.filter(Alert.severity == severity)
    if is_read is not None:
        q = q.filter(Alert.is_read == is_read)
    q = q.order_by(Alert.created_at.desc())
    total = q.count()
    alerts = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": [
            {
                "id": a.id,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "vehicle_id": a.vehicle_id,
                "trip_id": a.trip_id,
                "message": a.message,
                "is_read": bool(a.is_read),
                "is_resolved": bool(a.is_resolved),
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.put("/{alert_id}/read")
def mark_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if a:
        a.is_read = 1
        db.commit()
    return {"message": "Alert marked as read"}


@router.put("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if a:
        a.is_read = 1
        a.is_resolved = 1
        db.commit()
    return {"message": "Alert resolved"}
