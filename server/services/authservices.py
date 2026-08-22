import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from services.db import get_db_connection

JWT_SECRET = os.environ.get("JWT_SECRET", "dayflow_super_secret_key_987654321")
JWT_ALGORITHM = "HS256"

def verify_password(plain_password: str, stored_password: str) -> bool:
    if plain_password == stored_password:
        return True
    try:
        if stored_password.startswith("$2") and len(stored_password) == 60:
            return bcrypt.checkpw(plain_password.encode('utf-8'), stored_password.encode('utf-8'))
    except Exception:
        pass
    return False

def login(login_id: str, password: str):
    """
    Validates credentials (login_id can be email or employee_id).
    Returns user details and a JWT token valid for 1 hour.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query user by email or employee_id
    query = """
    SELECT id, employee_id, name, email, role, password, is_blocked
    FROM public.users
    WHERE (email = %s OR employee_id = %s);
    """
    
    try:
        cursor.execute(query, (login_id, login_id))
        row = cursor.fetchone()
        
        if not row:
            raise ValueError("Incorrect username or password")
            
        user_id, employee_id, name, email, role, stored_pwd, is_blocked = row
        
        if is_blocked:
            raise ValueError("Incorrect username or password")
            
        if not verify_password(password, stored_pwd or ""):
            raise ValueError("Incorrect username or password")
            
        # Create JWT payload
        expire = datetime.utcnow() + timedelta(hours=1)
        payload = {
            "sub": str(user_id),
            "employee_id": employee_id,
            "email": email,
            "role": role,
            "exp": expire
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return {
            "user": {
                "id": str(user_id),
                "employee_id": employee_id,
                "name": name,
                "email": email,
                "role": role
            },
            "token": token
        }
    finally:
        conn.close()
