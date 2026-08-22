from fastapi import APIRouter, Response, HTTPException
from pydantic import BaseModel
from services import authservices

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    login_id: str
    password: str

@router.post("/login")
def login(req: LoginRequest, response: Response):
    try:
        data = authservices.login(req.login_id, req.password)
        token = data["token"]
        
        # Set JWT in HTTP-only cookies (valid for 1 hour / 3600 seconds)
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=3600,
            samesite="lax",
            secure=False  # Set to True in production under HTTPS
        )
        
        return {
            "success": True,
            "user": data["user"],
            "token": token
        }
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logout")
def logout(response: Response):
    try:
        # Delete token from cookies
        response.delete_cookie(key="access_token")
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
