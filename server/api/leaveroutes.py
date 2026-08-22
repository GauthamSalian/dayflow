from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import leaveservices

router = APIRouter(prefix="/employee", tags=["employee"])


class LeaveApplyRequest(BaseModel):
    user_id: str
    leave_type: str
    start_date: str
    end_date: str
    reason: Optional[str] = None


class LeaveRecordResponse(BaseModel):
    id: str
    leave_type: str
    start_date: str
    end_date: str
    reason: Optional[str]
    status: str
    admin_comment: Optional[str]
    duration_days: int


class LeaveBalanceResponse(BaseModel):
    user_id: str
    annual_leave_days: int
    used_leave_days: int
    remaining_leave_balance: int


@router.post("/leave/apply")
def apply_for_leave(req: LeaveApplyRequest):
    try:
        return leaveservices.apply_leave(
            user_id=req.user_id,
            leave_type=req.leave_type,
            start_date=req.start_date,
            end_date=req.end_date,
            reason=req.reason
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaves/{user_id}", response_model=List[LeaveRecordResponse])
def get_leave_history(user_id: str):
    try:
        return leaveservices.get_leave_history(user_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leave/balance/{user_id}", response_model=LeaveBalanceResponse)
def get_leave_balance(user_id: str):
    try:
        return leaveservices.get_leave_balance(user_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
