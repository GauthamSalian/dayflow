from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import attendanceservices

router = APIRouter(prefix="/employee", tags=["employee"])


class AttendanceRecordResponse(BaseModel):
    date: str
    check_in: Optional[str]
    check_out: Optional[str]
    status: str


class AttendanceStatsResponse(BaseModel):
    total_days_this_year: int
    days_attended_this_year: int
    leaves_approved_this_year: int


@router.get("/attendance/{user_id}", response_model=List[AttendanceRecordResponse])
def get_attendance_history(user_id: str):
    try:
        return attendanceservices.get_employee_attendance_history(user_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance/stats/{user_id}", response_model=AttendanceStatsResponse)
def get_attendance_stats(user_id: str):
    try:
        return attendanceservices.get_employee_attendance_stats(user_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
