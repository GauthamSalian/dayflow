const BASE_URL = "http://localhost:8000/api";

// Helper for making API calls
async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  
  // Set default headers
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  // Include credentials (cookies) to support HTTP-only JWT handling
  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || errorDetail;
    } catch {
      // Use status text if JSON parsing fails
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const api = {
  // Auth endpoints
  auth: {
    login: (login_id: string, password: string) => 
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login_id, password })
      }),
    logout: () => 
      apiFetch("/auth/logout", { method: "POST" })
  },
  
  // Admin endpoints
  admin: {
    getEmployees: () => 
      apiFetch("/admin/employees"),
    
    createEmployee: (data: {
      name: string;
      email: string;
      phone: string;
      date_of_joining: string;
      salary: number;
      address: string;
    }) => 
      apiFetch("/admin/employees", {
        method: "POST",
        body: JSON.stringify(data)
      }),
      
    getLeaves: () => 
      apiFetch("/admin/leaves"),
      
    actionLeave: (leave_id: string, status: "APPROVED" | "REJECTED", admin_comment: string) => 
      apiFetch("/admin/leaves/action", {
        method: "POST",
        body: JSON.stringify({ leave_id, status, admin_comment })
      }),
      
    getAttendance: (user_id: string) => 
      apiFetch(`/admin/attendance/${user_id}`),
      
    getPayroll: () => 
      apiFetch("/admin/payroll"),
      
    updatePayroll: (data: {
      user_id: string;
      basic_salary: number;
      allowances: number;
      deductions: number;
    }) => 
      apiFetch("/admin/payroll/update", {
        method: "POST",
        body: JSON.stringify(data)
      }),
      
    blockEmployee: (user_id: string) => 
      apiFetch(`/admin/employees/block/${user_id}`, { method: "POST" }),
      
    updateRole: (user_id: string, role: "ADMIN" | "EMPLOYEE") =>
      apiFetch(`/admin/employees/role/${user_id}`, {
        method: "POST",
        body: JSON.stringify({ role })
      }),
      
    editEmployee: (user_id: string, data: { name: string; phone: string; address: string; salary: number }) =>
      apiFetch(`/admin/employees/edit/${user_id}`, {
        method: "POST",
        body: JSON.stringify(data)
      }),
      
    markAttendanceManual: (data: { user_id: string; date: string; status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" }) =>
      apiFetch("/admin/attendance/manual", {
        method: "POST",
        body: JSON.stringify(data)
      }),
      
    getEmployeeProfileDetail: (user_id: string) =>
      apiFetch(`/admin/employees/profile/${user_id}`)
  },

  // Employee endpoints
  employee: {
    getProfile: (user_id: string) =>
      apiFetch(`/employee/profile/${user_id}`),

    getAttendance: (user_id: string) =>
      apiFetch(`/employee/attendance/${user_id}`),

    getAttendanceStats: (user_id: string) =>
      apiFetch(`/employee/attendance/stats/${user_id}`),

    getLeaves: (user_id: string) =>
      apiFetch(`/employee/leaves/${user_id}`),

    getLeaveBalance: (user_id: string) =>
      apiFetch(`/employee/leave/balance/${user_id}`),

    applyLeave: (data: {
      user_id: string;
      leave_type: string;
      start_date: string;
      end_date: string;
      reason?: string;
    }) =>
      apiFetch("/employee/leave/apply", {
        method: "POST",
        body: JSON.stringify(data)
      })
  }
};
