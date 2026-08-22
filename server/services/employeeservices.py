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