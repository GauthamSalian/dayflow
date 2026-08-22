from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from services import adminservices

router = APIRouter(prefix="/admin", tags=["admin"])

# --- Request/Response Models ---

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    date_of_joining: str
    salary: float
    address: str

class EmployeeCredentialsResponse(BaseModel):
    user_id: str
    employee_id: str
    email: str
    password: str

class EmployeeResponse(BaseModel):
    id: str
    employee_id: str
    name: str
    email: str
    phone: str
    is_present_today: bool

class LeaveActionRequest(BaseModel):
    leave_id: str
    status: str
    admin_comment: Optional[str] = ""

class LeaveRecord(BaseModel):
    id: str
    reason: Optional[str]
    leave_type: str
    start_date: str
    end_date: str
    duration_days: int
    employee_name: str
    status: str

class LeavesDashboardResponse(BaseModel):
    decision_taken: List[LeaveRecord]
    to_be_approved: List[LeaveRecord]

class AttendanceStatsResponse(BaseModel):
    total_days_this_year: int
    days_attended_this_year: int
    leaves_approved_this_year: int

class PayrollResponse(BaseModel):
    user_id: str
    employee_id: str
    name: str
    email: str
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    updated_at: Optional[str]

class SalaryUpdateRequest(BaseModel):
    user_id: str
    basic_salary: float
    allowances: float
    deductions: float

# --- Routes ---

@router.get("/employees", response_model=List[EmployeeResponse])
def get_employees():
    try:
        return adminservices.list_employees()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/employees", response_model=EmployeeCredentialsResponse)
def create_employee(emp: EmployeeCreate):
    try:
        creds = adminservices.add_new_employee(
            name=emp.name,
            email=emp.email,
            phone=emp.phone,
            date_of_joining=emp.date_of_joining,
            salary=emp.salary,
            address=emp.address
        )
        return creds
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaves", response_model=LeavesDashboardResponse)
def get_leaves():
    try:
        return adminservices.list_leaves_last_3_days()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/leaves/action")
def update_leave_status(action: LeaveActionRequest):
    try:
        return adminservices.action_leave(
            leave_id=action.leave_id,
            status=action.status,
            admin_comment=action.admin_comment
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/attendance/{user_id}", response_model=AttendanceStatsResponse)
def get_employee_attendance(user_id: str):
    try:
        return adminservices.view_attendance(user_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payroll", response_model=List[PayrollResponse])
def get_payroll():
    try:
        return adminservices.get_all_payroll()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payroll/update")
def update_payroll(req: SalaryUpdateRequest):
    try:
        return adminservices.update_salary_structure(
            user_id=req.user_id,
            basic_salary=req.basic_salary,
            allowances=req.allowances,
            deductions=req.deductions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/employees/block/{user_id}")
def block_employee(user_id: str):
    try:
        return adminservices.delete_employee_account(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RoleUpdateRequest(BaseModel):
    role: str

@router.post("/employees/role/{user_id}")
def update_role(user_id: str, req: RoleUpdateRequest):
    try:
        return adminservices.update_user_role(user_id, req.role)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
