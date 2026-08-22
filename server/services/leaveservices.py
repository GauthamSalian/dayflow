import os
from datetime import datetime

from services.db import get_db_connection


def _format_date(value):
    if value is None:
        return None
    if hasattr(value, 'strftime'):
        return value.strftime('%Y-%m-%d')
    return str(value)


def apply_leave(user_id: str, leave_type: str, start_date: str, end_date: str, reason: str = None):
    """
    Creates a leave application for an employee in PENDING status.
    """
    if not leave_type or not start_date or not end_date:
        raise ValueError('leave_type, start_date, and end_date are required.')

    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        raise ValueError('Dates must be in YYYY-MM-DD format.')

    if end_dt < start_dt:
        raise ValueError('End date cannot be before start date.')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        INSERT INTO public.leaves (user_id, leave_type, start_date, end_date, reason, status)
        VALUES (%s, %s, %s, %s, %s, 'PENDING')
        RETURNING id, leave_type, start_date, end_date, reason, status;
    """

    try:
        cursor.execute(query, (user_id, leave_type, start_dt, end_dt, reason))
        row = cursor.fetchone()
        conn.commit()

        if not row:
            raise ValueError('Leave application could not be created.')

        return {
            "success": True,
            "message": "Leave application submitted successfully.",
            "id": str(row[0]),
            "leave_type": row[1],
            "start_date": _format_date(row[2]),
            "end_date": _format_date(row[3]),
            "reason": row[4],
            "status": row[5]
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def get_leave_history(user_id: str):
    """
    Returns leave history for a specific employee.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT id, leave_type, start_date, end_date, reason, status, admin_comment
        FROM public.leaves
        WHERE user_id = %s
        ORDER BY start_date DESC, created_at DESC;
    """

    try:
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        leave_history = []
        for row in rows:
            start_date = row[2]
            end_date = row[3]
            duration_days = (end_date - start_date).days + 1 if start_date and end_date else 0

            leave_history.append({
                "id": str(row[0]),
                "leave_type": row[1],
                "start_date": _format_date(start_date),
                "end_date": _format_date(end_date),
                "reason": row[4],
                "status": row[5],
                "admin_comment": row[6],
                "duration_days": int(duration_days)
            })

        return leave_history
    finally:
        conn.close()


def get_leave_balance(user_id: str):
    """
    Returns remaining leave balance for the current year.
    Uses a default annual entitlement of 12 days unless overridden by env var.
    """
    annual_leave_days = int(os.environ.get('ANNUAL_LEAVE_DAYS', '12'))
    current_year = datetime.now().year

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT COALESCE(SUM(end_date - start_date + 1), 0)
        FROM public.leaves
        WHERE user_id = %s
          AND status = 'APPROVED'
          AND EXTRACT(YEAR FROM start_date) = %s;
    """

    try:
        cursor.execute(query, (user_id, current_year))
        used_leave_days = int(cursor.fetchone()[0])
        remaining_leave_balance = max(0, annual_leave_days - used_leave_days)

        return {
            "user_id": str(user_id),
            "annual_leave_days": annual_leave_days,
            "used_leave_days": used_leave_days,
            "remaining_leave_balance": remaining_leave_balance
        }
    finally:
        conn.close()
