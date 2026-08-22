from services.db import get_db_connection

def get_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                id,
                employee_id,
                name,
                email,
                phone,
                date_of_joining
            FROM public.users
            WHERE id = %s
        """, (user_id,))

        row = cursor.fetchone()

        if not row:
            return None

        return {
            "id": str(row[0]),
            "employee_id": row[1],
            "name": row[2],
            "email": row[3],
            "phone": row[4],
            "date_of_joining": str(row[5]) if row[5] else None
        }

    finally:
        cursor.close()
        conn.close()

def change_password(user_id: str, current_password: str, new_password: str):
    """
    Verifies the current password and updates it with the new password.
    Hashes the new password using bcrypt and updates both public.users and auth.users tables.
    """
    import bcrypt
    import json
    from services.authservices import verify_password
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Fetch current password
        cursor.execute("SELECT password FROM public.users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError("Employee not found")
            
        stored_pwd = row[0]
        # Verify current password
        if not verify_password(current_password, stored_pwd or ""):
            raise ValueError("Incorrect current password")
            
        # 2. Hash new password
        salt = bcrypt.gensalt(rounds=10)
        hashed_pwd = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
        
        # 3. Update public.users
        cursor.execute(
            "UPDATE public.users SET password = %s WHERE id = %s",
            (hashed_pwd, user_id)
        )
        
        # 4. Update auth.users (encrypted_password and raw_user_meta_data)
        meta_update = {"password": hashed_pwd}
        cursor.execute(
            """
            UPDATE auth.users
            SET encrypted_password = %s,
                raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || %s::jsonb
            WHERE id = %s;
            """,
            (hashed_pwd, json.dumps(meta_update), user_id)
        )
        
        conn.commit()
        return {"success": True, "message": "Password changed successfully."}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()