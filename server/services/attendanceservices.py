from datetime import datetime

from services.db import get_db_connection


def _format_datetime(value):
    if value is None:
        return None
    if hasattr(value, 'strftime'):
        return value.strftime('%Y-%m-%d %H:%M:%S')
    return str(value)


def get_employee_attendance_history(user_id: str):
    """
    Returns attendance history for an employee.
    Includes date, check_in, check_out, and status for each record.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT date, check_in, check_out, status
        FROM public.attendance
        WHERE user_id = %s
        ORDER BY date DESC;
    """

    try:
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        attendance = []
        for row in rows:
            attendance.append({
                "date": row[0].strftime('%Y-%m-%d') if hasattr(row[0], 'strftime') else str(row[0]),
                "check_in": _format_datetime(row[1]),
                "check_out": _format_datetime(row[2]),
                "status": row[3]
            })

        return attendance
    finally:
        conn.close()


def get_employee_attendance_stats(user_id: str):
    """
    Displays attendance statistics for a particular employee.
    Includes:
    - total_days_this_year
    - days_attended_this_year
    - leaves_approved_this_year
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT date_of_joining FROM public.users WHERE id = %s", (user_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"User with ID {user_id} not found.")

        date_of_joining = res[0]
        now = datetime.now()
        start_of_year = datetime(now.year, 1, 1).date()

        if date_of_joining:
            if hasattr(date_of_joining, 'year') and date_of_joining.year == now.year:
                start_date = date_of_joining
            elif isinstance(date_of_joining, str):
                doj_date = datetime.strptime(date_of_joining, '%Y-%m-%d').date()
                start_date = doj_date if doj_date.year == now.year else start_of_year
            else:
                start_date = start_of_year
        else:
            start_date = start_of_year

        total_days_this_year = (now.date() - start_date).days + 1

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM public.attendance
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM date) = %s
              AND status IN ('PRESENT', 'HALF_DAY');
            """,
            (user_id, now.year)
        )
        days_attended_this_year = int(cursor.fetchone()[0])

        cursor.execute(
            """
            SELECT COALESCE(SUM(end_date - start_date + 1), 0)
            FROM public.leaves
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
