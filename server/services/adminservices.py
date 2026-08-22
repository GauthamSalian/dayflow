import os
import sys
import uuid
import bcrypt
from datetime import datetime
from services.db import get_db_connection

def list_employees():
    """
    Displays the name of all users, if they are present today, their phone number, and email.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        u.id,
        u.employee_id,
        u.name, 
        u.email, 
        u.phone,
        EXISTS (
            SELECT 1 FROM public.attendance a 
            WHERE a.user_id = u.id AND a.date = CURRENT_DATE AND a.status IN ('PRESENT', 'HALF_DAY')
        ) as is_present
    FROM public.users u
    WHERE u.role = 'EMPLOYEE' AND u.is_blocked = FALSE
    ORDER BY u.created_at DESC;
    """
    
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        
        employees = []
        for r in rows:
            employees.append({
                "id": str(r[0]),
                "employee_id": r[1],
                "name": r[2],
                "email": r[3],
                "phone": r[4],
                "is_present_today": r[5]
            })
        return employees
    finally:
        conn.close()

def get_next_serial_number(year: int) -> str:
    """
    Queries public.users for employee_ids containing the specified year and returns the next 4-digit serial.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT employee_id FROM public.users WHERE employee_id LIKE %s"
    cursor.execute(query, (f"%{year}%",))
    rows = cursor.fetchall()
    conn.close()
    
    max_serial = 0
    for row in rows:
        emp_id = row[0]
        # The serial is the last 4 digits (e.g., OIALJO20260001)
        if len(emp_id) >= 8:
            serial_part = emp_id[-4:]
            if serial_part.isdigit():
                val = int(serial_part)
                if val > max_serial:
                    max_serial = val
                    
    next_serial = max_serial + 1
    return f"{next_serial:04d}"

def generate_login_id(name: str, date_of_joining: str) -> str:
    """
    Generates a login ID (employee_id) in the format:
    [CompanyInitials][NameInitials][Year][Serial]
    """
    company_name = os.environ.get("COMPANY_NAME", "Odoo India")
    
    # 1. Company Initials (first letter of first two words, or first two letters of single word)
    words = company_name.strip().split()
    if len(words) >= 2:
        co_prefix = (words[0][0] + words[1][0]).upper()
    elif len(words) == 1:
        co_prefix = words[0][:2].upper()
    else:
        co_prefix = "OI"
        
    # 2. Name Initials (first 2 letters of first name and first 2 of last name)
    parts = name.strip().split()
    if len(parts) >= 2:
        first = parts[0][:2]
        last = parts[-1][:2]
        # Pad with X if initials are shorter than 2 chars
        first = (first + "X")[:2]
        last = (last + "X")[:2]
        name_prefix = (first + last).upper()
    elif len(parts) == 1:
        first = parts[0][:2]
        first = (first + "X")[:2]
        name_prefix = (first + "XX").upper()
    else:
        name_prefix = "XXXX"
        
    # 3. Year
    try:
        # Extract year from date string (expects YYYY-MM-DD or similar)
        year = date_of_joining.split("-")[0]
        # Ensure it is a 4-digit year
        if not (year.isdigit() and len(year) == 4):
            year = str(datetime.now().year)
    except Exception:
        year = str(datetime.now().year)
        
    # 4. Serial
    serial = get_next_serial_number(int(year))
    
    return f"{co_prefix}{name_prefix}{year}{serial}"

def hash_password(password: str) -> str:
    """
    Hashes a password using bcrypt for Supabase Auth compatibility.
    """
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def add_new_employee(name: str, email: str, phone: str, date_of_joining: str, salary: float, address: str):
    """
    Adds a new employee:
    - Generates employee ID and password (password same as login ID)
    - Hashes password using bcrypt
    - Inserts into auth.users (triggers insertion into public.users)
    - Updates public.users with date_of_joining
    - Creates payroll entry
    - Returns credentials
    """
    # Validate fields
    if not (name and email and phone and date_of_joining and salary is not None and address):
        raise ValueError("All fields are mandatory: name, email, phone, date_of_joining, salary, address")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM auth.users WHERE email = %s", (email,))
        if cursor.fetchone():
            raise ValueError(f"An account with email '{email}' already exists.")
            
        # Generate credentials
        login_id = generate_login_id(name, date_of_joining)
        password = login_id # password same as login id initially
        
        user_uuid = str(uuid.uuid4())
        hashed_pwd = hash_password(password)
        
        # Metadata for the trigger
        raw_user_meta_data = f'{{"name": "{name}", "role": "EMPLOYEE", "employee_id": "{login_id}", "phone": "{phone}", "address": "{address}", "password": "{password}"}}'
        
        # 1. Insert into auth.users
        insert_auth_sql = """
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, aud, role
        )
        VALUES (
            %s, '00000000-0000-0000-0000-000000000000', %s, %s, NOW(), 
            '{"provider": "email", "providers": ["email"]}'::jsonb, %s::jsonb, 'authenticated', 'authenticated'
        );
        """
        cursor.execute(insert_auth_sql, (user_uuid, email, hashed_pwd, raw_user_meta_data))
        
        # 2. Update public.users with date_of_joining (the trigger creates the row automatically)
        update_public_sql = """
        UPDATE public.users 
        SET date_of_joining = %s 
        WHERE id = %s;
        """
        cursor.execute(update_public_sql, (date_of_joining, user_uuid))
        
        # 3. Create payroll entry
        insert_payroll_sql = """
        INSERT INTO public.payroll (user_id, basic_salary, allowances, deductions, net_salary, updated_at)
        VALUES (%s, %s, 0, 0, %s, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            basic_salary = EXCLUDED.basic_salary,
            net_salary = EXCLUDED.net_salary,
            updated_at = NOW();
        """
        cursor.execute(insert_payroll_sql, (user_uuid, salary, salary))
        
        # Commit transaction
        conn.commit()
        
        return {
            "user_id": user_uuid,
            "employee_id": login_id,
            "email": email,
            "password": password
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def list_leaves_last_3_days():
    """
    Displays leave requests from the last three days.
    Returns a dictionary with two lists:
    - decision_taken: requests already APPROVED or REJECTED
    - to_be_approved: PENDING requests
    Each request contains: reason, start_date, end_date, employee_name, duration_days, leave_type
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        l.id,
        l.reason,
        l.leave_type,
        l.start_date,
        l.end_date,
        (l.end_date - l.start_date + 1) as duration_days,
        u.name as employee_name,
        l.status
    FROM public.leaves l
    JOIN public.users u ON l.user_id = u.id
    WHERE l.created_at >= CURRENT_DATE - INTERVAL '3 days'
    ORDER BY l.created_at DESC;
    """
    
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        
        decision_taken = []
        to_be_approved = []
        
        for r in rows:
            record = {
                "id": str(r[0]),
                "reason": r[1],
                "leave_type": r[2],
                "start_date": r[3].strftime("%Y-%m-%d") if isinstance(r[3], datetime) or hasattr(r[3], 'strftime') else str(r[3]),
                "end_date": r[4].strftime("%Y-%m-%d") if isinstance(r[4], datetime) or hasattr(r[4], 'strftime') else str(r[4]),
                "duration_days": int(r[5]),
                "employee_name": r[6],
                "status": r[7]
            }
            if r[7] == 'PENDING':
                to_be_approved.append(record)
            else:
                decision_taken.append(record)
                
        return {
            "decision_taken": decision_taken,
            "to_be_approved": to_be_approved
        }
    finally:
        conn.close()

def action_leave(leave_id: str, status: str, admin_comment: str):
    """
    Sets status (APPROVED or REJECTED) and admin_comment for a leave request.
    """
    if status not in ('APPROVED', 'REJECTED'):
        raise ValueError("Status must be either APPROVED or REJECTED")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    UPDATE public.leaves
    SET status = %s, admin_comment = %s
    WHERE id = %s;
    """
    try:
        cursor.execute(query, (status, admin_comment, leave_id))
        conn.commit()
        return {"success": True, "message": f"Leave request {leave_id} has been {status.lower()}."}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def view_attendance(user_id: str):
    """
    Displays attendance statistics for a particular employee.
    Includes:
    - total_days_this_year: days from the start of the year (or joining date if joined this year) to today
    - days_attended_this_year: how many days they clocked in (PRESENT or HALF_DAY)
    - leaves_approved_this_year: sum of approved leave days this year
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Fetch user's date of_joining
        cursor.execute("SELECT date_of_joining FROM public.users WHERE id = %s", (user_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"User with ID {user_id} not found.")
            
        date_of_joining = res[0]
        
        now = datetime.now()
        start_of_year = datetime(now.year, 1, 1).date()
        
        if date_of_joining:
            # handle if joined this year or earlier
            if hasattr(date_of_joining, 'year') and date_of_joining.year == now.year:
                start_date = date_of_joining
            elif isinstance(date_of_joining, str):
                doj_date = datetime.strptime(date_of_joining, "%Y-%m-%d").date()
                start_date = doj_date if doj_date.year == now.year else start_of_year
            else:
                start_date = start_of_year
        else:
            start_date = start_of_year
            
        total_days_this_year = (now.date() - start_date).days + 1
        
        # 2. Count days attended this year
        cursor.execute(
            """
            SELECT COUNT(*) FROM public.attendance 
            WHERE user_id = %s 
              AND EXTRACT(YEAR FROM date) = %s 
              AND status IN ('PRESENT', 'HALF_DAY');
            """,
            (user_id, now.year)
        )
        days_attended_this_year = cursor.fetchone()[0]
        
        # 3. Sum of leaves approved this year
        cursor.execute(
            """
            SELECT COALESCE(SUM(end_date - start_date + 1), 0) FROM public.leaves
            WHERE user_id = %s 
              AND status = 'APPROVED' 
              AND EXTRACT(YEAR FROM start_date) = %s;
            """,
            (user_id, now.year)
        )
        leaves_approved_this_year = int(cursor.fetchone()[0])
        
        return {
            "total_days_this_year": total_days_this_year,
            "days_attended_this_year": days_attended_this_year,
            "leaves_approved_this_year": leaves_approved_this_year
        }
        
    finally:
        conn.close()

def get_all_payroll():
    """
    Displays the payroll structure of all employees.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        u.id as user_id,
        u.employee_id,
        u.name,
        u.email,
        COALESCE(p.basic_salary, 0),
        COALESCE(p.allowances, 0),
        COALESCE(p.deductions, 0),
        COALESCE(p.net_salary, 0),
        p.updated_at
    FROM public.users u
    LEFT JOIN public.payroll p ON p.user_id = u.id
    WHERE u.role = 'EMPLOYEE' AND u.is_blocked = FALSE
    ORDER BY u.created_at DESC;
    """
    
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        
        payrolls = []
        for r in rows:
            payrolls.append({
                "user_id": str(r[0]),
                "employee_id": r[1],
                "name": r[2],
                "email": r[3],
                "basic_salary": float(r[4]),
                "allowances": float(r[5]),
                "deductions": float(r[6]),
                "net_salary": float(r[7]),
                "updated_at": r[8].strftime("%Y-%m-%d %H:%M:%S") if r[8] else None
            })
        return payrolls
    finally:
        conn.close()

def update_salary_structure(user_id: str, basic_salary: float, allowances: float, deductions: float):
    """
    Updates the salary structure (basic, allowances, deductions) for an employee.
    Net salary is auto-calculated as basic + allowances - deductions.
    """
    net_salary = basic_salary + allowances - deductions
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    INSERT INTO public.payroll (user_id, basic_salary, allowances, deductions, net_salary, updated_at)
    VALUES (%s, %s, %s, %s, %s, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        basic_salary = EXCLUDED.basic_salary,
        allowances = EXCLUDED.allowances,
        deductions = EXCLUDED.deductions,
        net_salary = EXCLUDED.net_salary,
        updated_at = NOW();
    """
    
    try:
        cursor.execute(query, (user_id, basic_salary, allowances, deductions, net_salary))
        conn.commit()
        return {
            "success": True,
            "message": "Salary structure updated successfully.",
            "net_salary": net_salary
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_employee_account(user_id: str):
    """
    Blocks the employee's account from logging in, but keeps data intact in the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    UPDATE public.users
    SET is_blocked = TRUE
    WHERE id = %s;
    """
    try:
        cursor.execute(query, (user_id,))
        # Also try to block in auth.users by setting a ban duration or removing metadata
        # (Supabase doesn't natively enforce this unless we hook it, but changing a custom metadata is_blocked
        # or checking is_blocked in local FastAPI routes will prevent successful JWT login checks).
        conn.commit()
        return {"success": True, "message": f"Employee account {user_id} has been blocked."}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
