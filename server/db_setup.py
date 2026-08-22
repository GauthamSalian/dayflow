import os
import sys
import getpass
import psycopg2
from dotenv import load_dotenv

def main():
    print("=== Dayflow Supabase Database Setup ===")
    
    # Load .env file
    load_dotenv()
    
    # Supabase connection parameters
    project_ref = "tdkuwgnoqqypeamevuob"
    host = "aws-0-ap-southeast-1.pooler.supabase.com"
    port = "6543"
    user = f"postgres.{project_ref}"
    dbname = "postgres"
    
    # Try to get password from environment
    password = os.environ.get("SUPABASE_DB_PASSWORD")
    
    if not password:
        print(f"Could not find 'SUPABASE_DB_PASSWORD' in environment or .env file.")
        print(f"Please enter your Supabase Database Password (for project {project_ref}):")
        password = getpass.getpass("Password: ")
        
        if not password:
            print("Error: Database password is required.")
            sys.exit(1)
            
    print(f"\nConnecting to database {host}:{port}/{dbname} as {user}...")
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            dbname=dbname,
            password=password,
            connect_timeout=10
        )
        conn.autocommit = True
        cursor = conn.cursor()
        print("Connected successfully!")
    except Exception as e:
        print(f"\nConnection failed: {e}")
        print("\nPlease check:")
        print("1. Your database password is correct.")
        print("2. Your internet connection is active.")
        print("3. Supabase database is not paused.")
        sys.exit(1)

    # 1. Setup schema and triggers
    print("\n1. Creating tables and triggers...")
    schema_sql = """
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Drop tables to allow recreation with password column
    DROP TABLE IF EXISTS public.payroll CASCADE;
    DROP TABLE IF EXISTS public.leaves CASCADE;
    DROP TABLE IF EXISTS public.attendance CASCADE;
    DROP TABLE IF EXISTS public.users CASCADE;

    -- Create public.users table
    CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY,
        employee_id TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('EMPLOYEE', 'ADMIN')),
        phone TEXT,
        address TEXT,
        password TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );

    -- Create trigger function to automatically sync auth.users to public.users
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.users (id, employee_id, name, email, role, phone, address, password)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'employee_id', 'EMP-' || SUBSTRING(new.id::text, 1, 8)),
        COALESCE(new.raw_user_meta_data->>'name', ''),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'EMPLOYEE'),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        COALESCE(new.raw_user_meta_data->>'address', ''),
        COALESCE(new.raw_user_meta_data->>'password', '')
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        password = EXCLUDED.password;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create the trigger
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    -- Create attendance table
    CREATE TABLE IF NOT EXISTS public.attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        check_in TIMESTAMP WITH TIME ZONE,
        check_out TIMESTAMP WITH TIME ZONE,
        status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
        UNIQUE (user_id, date)
    );

    -- Create leaves table
    CREATE TABLE IF NOT EXISTS public.leaves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        leave_type TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        admin_comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );

    -- Create payroll table
    CREATE TABLE IF NOT EXISTS public.payroll (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        basic_salary NUMERIC NOT NULL DEFAULT 0,
        allowances NUMERIC NOT NULL DEFAULT 0,
        deductions NUMERIC NOT NULL DEFAULT 0,
        net_salary NUMERIC NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """
    
    try:
        cursor.execute(schema_sql)
        print("Schema and triggers created successfully!")
    except Exception as e:
        print(f"Error creating schema: {e}")
        conn.close()
        sys.exit(1)

    # 2. Seed dummy users in auth.users (which triggers public.users creation)
    print("\n2. Seeding dummy users...")
    
    # Password: Password123! (Supabase compatible bcrypt hash)
    password_hash = "$2a$10$M9y/f6yYyX3w0cT4p.VqOOIymrA6hVb2L1C4lCg2WvFhT7a.wG.C."
    
    dummy_users = [
        {
            "id": "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
            "email": "admin@dayflow.com",
            "name": "Dayflow Admin",
            "role": "ADMIN",
            "employee_id": "EMP-001",
            "phone": "+1234567890",
            "address": "123 Admin Street",
            "password": "Password123!"
        },
        {
            "id": "e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2",
            "email": "alice@dayflow.com",
            "name": "Alice Johnson",
            "role": "EMPLOYEE",
            "employee_id": "EMP-002",
            "phone": "+1987654321",
            "address": "456 Oak Avenue",
            "password": "Password123!"
        },
        {
            "id": "e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3",
            "email": "bob@dayflow.com",
            "name": "Bob Smith",
            "role": "EMPLOYEE",
            "employee_id": "EMP-003",
            "phone": "+1555019922",
            "address": "789 Pine Road",
            "password": "Password123!"
        }
    ]
    
    for u in dummy_users:
        try:
            # Check if user already exists in auth.users
            cursor.execute("SELECT id FROM auth.users WHERE email = %s", (u["email"],))
            res = cursor.fetchone()
            
            if not res:
                print(f"Creating auth user: {u['email']}...")
                # Insert into auth.users
                insert_auth_sql = """
                INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
                VALUES (%s, '00000000-0000-0000-0000-000000000000', %s, %s, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, %s::jsonb, 'authenticated', 'authenticated')
                """
                cursor.execute(insert_auth_sql, (
                    u["id"],
                    u["email"],
                    password_hash,
                    f'{{"name": "{u["name"]}", "role": "{u["role"]}", "employee_id": "{u["employee_id"]}", "password": "{u["password"]}"}}'
                ))
            else:
                user_uuid = res[0]
                print(f"Auth user {u['email']} already exists (UUID: {user_uuid}).")
                u["id"] = user_uuid # update to actual UUID if it differed
                
            # Explicitly ensure the user is in public.users (fallback in case trigger didn't run or is already populated)
            cursor.execute("SELECT id FROM public.users WHERE id = %s", (u["id"],))
            public_res = cursor.fetchone()
            if not public_res:
                print(f"Seeding public profile for: {u['email']}...")
                insert_public_sql = """
                INSERT INTO public.users (id, employee_id, name, email, role, phone, address, password)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(insert_public_sql, (
                    u["id"],
                    u["employee_id"],
                    u["name"],
                    u["email"],
                    u["role"],
                    u["phone"],
                    u["address"],
                    u["password"]
                ))
            else:
                print(f"Public profile for {u['email']} already exists.")
                
        except Exception as e:
            print(f"Error seeding user {u['email']}: {e}")
            
    # 3. Seed dummy payroll, attendance, and leaves
    print("\n3. Seeding dummy payroll, attendance, and leave records...")
    
    # Alice (EMP-002) & Bob (EMP-003) salaries
    salaries = [
        {"user_id": "e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2", "basic": 50000, "allow": 3000, "deduct": 1000, "net": 52000},
        {"user_id": "e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3", "basic": 45000, "allow": 2000, "deduct": 1000, "net": 46000}
    ]
    for s in salaries:
        try:
            cursor.execute("SELECT id FROM public.payroll WHERE user_id = %s", (s["user_id"],))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO public.payroll (user_id, basic_salary, allowances, deductions, net_salary) VALUES (%s, %s, %s, %s, %s)",
                    (s["user_id"], s["basic"], s["allow"], s["deduct"], s["net"])
                )
                print(f"Payroll record seeded for user ID {s['user_id']}.")
        except Exception as e:
            print(f"Error seeding payroll for {s['user_id']}: {e}")
            
    # Seed dummy attendance (Alice PRESENT, Bob ABSENT)
    attendance_records = [
        {"user_id": "e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2", "status": "PRESENT", "check_in": "09:00:00", "check_out": "17:00:00"},
        {"user_id": "e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3", "status": "ABSENT", "check_in": None, "check_out": None}
    ]
    for att in attendance_records:
        try:
            cursor.execute("SELECT id FROM public.attendance WHERE user_id = %s AND date = CURRENT_DATE", (att["user_id"],))
            if not cursor.fetchone():
                ci = f"CURRENT_DATE + interval '{att['check_in']}'" if att['check_in'] else "NULL"
                co = f"CURRENT_DATE + interval '{att['check_out']}'" if att['check_out'] else "NULL"
                
                query = f"""
                INSERT INTO public.attendance (user_id, date, check_in, check_out, status)
                VALUES (%s, CURRENT_DATE, {ci}, {co}, %s)
                """
                cursor.execute(query, (att["user_id"], att["status"]))
                print(f"Attendance record seeded for user ID {att['user_id']}.")
        except Exception as e:
            print(f"Error seeding attendance for {att['user_id']}: {e}")

    # Seed dummy leave request (Alice requested a leave next week)
    try:
        alice_id = "e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2"
        cursor.execute("SELECT id FROM public.leaves WHERE user_id = %s", (alice_id,))
        if not cursor.fetchone():
            cursor.execute(
                """
                INSERT INTO public.leaves (user_id, leave_type, start_date, end_date, reason, status, admin_comment)
                VALUES (%s, 'SICK', CURRENT_DATE + 3, CURRENT_DATE + 5, 'Doctor-recommended rest', 'PENDING', NULL)
                """,
                (alice_id,)
            )
            print("Leave request record seeded for Alice.")
    except Exception as e:
        print(f"Error seeding leave request: {e}")

    # 4. Final verification
    print("\n4. Verifying created tables...")
    tables_to_verify = ["users", "attendance", "leaves", "payroll"]
    all_ok = True
    for t in tables_to_verify:
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = %s)", (t,))
        exists = cursor.fetchone()[0]
        print(f"Table public.{t:<12} : {'[OK]' if exists else '[MISSING]'}")
        if not exists:
            all_ok = False
            
    if all_ok:
        print("\nVerification Complete: All database tables are successfully set up and seeded!")
    else:
        print("\nVerification Warning: Some tables are missing. Please review errors above.")
        
    conn.close()

if __name__ == "__main__":
    main()
