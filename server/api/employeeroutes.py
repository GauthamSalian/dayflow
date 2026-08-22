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