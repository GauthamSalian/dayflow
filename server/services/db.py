import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    project_ref = "tdkuwgnoqqypeamevuob"
    host = f"db.{project_ref}.supabase.co"
    port = "5432"
    user = "postgres"
    dbname = "postgres"
    password = os.environ.get("SUPABASE_DB_PASSWORD", "Hackathon001")
    
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        dbname=dbname,
        password=password
    )
    return conn

def run_migrations():
    conn = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Add columns to public.users
    cursor.execute("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_joining DATE;")
    cursor.execute("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;")
    
    # Add unique constraint to public.payroll(user_id) if not exists
    try:
        cursor.execute("ALTER TABLE public.payroll ADD CONSTRAINT unique_payroll_user_id UNIQUE (user_id);")
    except Exception:
        pass
        
    conn.close()

# Run migrations automatically on module import
try:
    run_migrations()
except Exception as e:
    print(f"Automatic migration failed: {e}")
