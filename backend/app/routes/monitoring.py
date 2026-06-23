from fastapi import APIRouter, HTTPException
from monitoring_agent import get_monthly_monitoring_report

router = APIRouter(tags=["monitoring"])

@router.get("/api/monitoring")
@router.get("/monitoring")
def get_monitoring(force: bool = False):
    try:
        report = get_monthly_monitoring_report(force=force)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
