# Dayflow 🌌

---

## 🚀 Key Features

### 1. Secure Authentication & User Security
- **JWT Session Hashing**: Secure cookies verify session credentials against the server database.
- **Bcrypt Salt Hashing**: All user passwords (including default onboarding passwords and self-service updates) are securely hashed using bcrypt before writing to the database.
- **Change Password Widget**: Self-service secure password modification inside the Employee Portal with length and match constraints.

### 2. Admin / Manager Dashboard
- **Headcount & Attendance Analytics**: Real-time cards calculating active staff numbers, average monthly attendance rates, and pending time-off actions.
- **Employee Directory**: Fully searchable portfolio table listing role, department, contact info, and clock-in statuses. Includes options to register new personnel or edit details.
- **Interactive Leave Pipelines**: Review box showing staff time-off requests. Managers can review dates, descriptions, and click to approve or deny leaves with custom decision comments in real time.

### 3. Detailed Employee Portfolio
- **Income Breakdown Card**: Shows the employee's payroll composition, including base pay, standard allowances, deductions, and final net payment calculations.
- **Quarterly Attendance Map**: A custom 2x2 grid representing the four quarters of the current year (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec). Renders daily block points (green for present, red for absent, grey for unlogged) fitting seamlessly into standard column containers without overflowing.
- **Leaves Ledger**: Displays pending time-off requests alongside historical decision records.

### 4. Employee Self-Service Portal
- **Daily Attendance Clock**: Real-time interactive panel to Clock In and Clock Out of active shifts, writing raw timestamps to the database.
- **Attendance Rate Filtering**: Dynamic analytics tracker allowing employees to calculate their average attendance percentage across custom ranges (1 week, 1 month, 3 months, 1 year).
- **Time-Off Application**: Direct form inputs to apply for Personal, Sick, or Vacation leave.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS (Modern premium glassmorphic dark theme)

### Backend (Server)
- **Engine**: [FastAPI (Python 3.9+)](https://fastapi.tiangolo.com/)
- **Database Connection**: Direct PostgreSQL pooling via [psycopg2-binary](https://pypi.org/project/psycopg2-binary/)
- **User Sync**: [Supabase Database & Metadata client](https://supabase.com/)
- **Encryption**: [Bcrypt](https://pypi.org/project/bcrypt/) password encryption
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)

---

## 📂 Project Structure

```bash
dayflow/
├── client/                     # React Frontend App
│   ├── src/
│   │   ├── components/         # Common UI Components
│   │   ├── pages/              # Portal Pages (Home, EmployeeProfile, Login)
│   │   ├── utils/              # API helpers and requests handler
│   │   ├── index.css           # Styling system variables and utilities
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                     # FastAPI Backend App
│   ├── api/                    # API Routing Modules (authroutes, adminroutes, employeeroutes)
│   ├── services/               # Database Queries & Service Logic (authservices, adminservices, employeeservices)
│   ├── db_setup.py             # Schema initializers and mock data seeders
│   ├── main.py                 # FastAPI application launcher
│   └── requirements.txt        # Python backend package list
└── README.md
```

---

## 🔧 Installation & Setup

### Prerequisites
- Python 3.9 or higher
- Node.js (v18 or higher) & npm
- PostgreSQL database credentials (e.g. Supabase connection details)

---

### Backend Server Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Create a virtual environment and activate it:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install required Python modules:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your database configuration file:
   - Copy `example.env` to a new file named `.env`:
     ```bash
     cp example.env .env
     ```
   - Edit the `.env` file and insert your Database Connection string and Supabase credentials:
     ```env
     DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>"
     SUPABASE_URL="https://<project-ref>.supabase.co"
     SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
     ```

5. Initialize the database schema and seed mock accounts:
   ```bash
   python db_setup.py
   ```

6. Launch the FastAPI server:
   ```bash
   python main.py
   ```
   The backend API docs will be accessible at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### Frontend Client Setup

1. Navigate to the client folder:
   ```bash
   cd client
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The web application will open on [http://localhost:5173](http://localhost:5173).

---

## 📡 API Reference Overview

| Action | Route | Method | Access Role | Description |
|---|---|---|---|---|
| **Login** | `/api/auth/login` | `POST` | Public | Authenticates credentials and issues session parameters |
| **Logout** | `/api/auth/logout` | `POST` | Public | Clears credentials |
| **Add Employee** | `/api/admin/employees` | `POST` | Admin | Registers a new employee, inserts basic salary, and seeds user database |
| **List Employees** | `/api/admin/employees` | `GET` | Admin | Lists all registered staff portfolios |
| **Update Profile** | `/api/admin/employees/{id}` | `PUT` | Admin | Modifies employee personal and billing metadata |
| **Leave Action** | `/api/admin/leaves/{id}/action` | `POST` | Admin | Approves/denies leave requests with decision comments |
| **Clock In/Out Status** | `/api/employee/status/{id}` | `GET` | Employee | Retrieves shift progress logs |
| **Shift Check In** | `/api/employee/clock-in` | `POST` | Employee | Creates a new present log entry with check-in timestamp |
| **Shift Check Out** | `/api/employee/clock-out` | `POST` | Employee | Closes shift log entry with check-out timestamp |
| **Apply Leave** | `/api/employee/leave` | `POST` | Employee | Submits a time-off application request |
| **Change Password** | `/api/employee/change-password/{id}`| `POST` | Employee | Validates credentials and hashes new password into database |

---
