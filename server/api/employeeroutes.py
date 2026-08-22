from fastapi import APIRouter, HTTPException
from services import employeeservices

router = APIRouter(
    prefix="/employee",
    tags=["employee"]
)

@router.get("/profile/{user_id}")
def get_profile(user_id: str):
    try:
        profile = employeeservices.get_profile(user_id)

        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Employee not found"
            )

        return profile

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

from pydantic import BaseModel

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password/{user_id}")
def change_password(user_id: str, req: ChangePasswordRequest):
    try:
        return employeeservices.change_password(
            user_id=user_id,
            current_password=req.current_password,
            new_password=req.new_password
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))