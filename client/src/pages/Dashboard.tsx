import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  Users, UserPlus, Calendar, DollarSign, LogOut, Loader2, 
  Check, X, CheckCircle, Ban
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'employees' | 'add-employee' | 'leaves' | 'payroll'>('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [leavesData, setLeavesData] = useState<{ decision_taken: any[], to_be_approved: any[] }>({ decision_taken: [], to_be_approved: [] });
  
  // Loading states
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  
  // Form states (Add Employee)
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDoj, setEmpDoj] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<any | null>(null);
  const [createError, setCreateError] = useState('');

  // Form states (Payroll Update)
  const [editingPayrollUserId, setEditingPayrollUserId] = useState<string | null>(null);
  const [editBasic, setEditBasic] = useState('');
  const [editAllowances, setEditAllowances] = useState('');
  const [editDeductions, setEditDeductions] = useState('');
  const [updatingPayroll, setUpdatingPayroll] = useState(false);

  // Form states (Leave Action)
  const [leaveComment, setLeaveComment] = useState<{ [key: string]: string }>({});
  const [actingOnLeave, setActingOnLeave] = useState<{ [key: string]: boolean }>({});

  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Redirect if not logged in or not admin
    if (!adminUser.role || adminUser.role !== 'ADMIN') {
      navigate('/login');
    }
  }, [navigate]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await api.admin.getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const data = await api.admin.getLeaves();
      setLeavesData(data || { decision_taken: [], to_be_approved: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchPayroll = async () => {
    setLoadingPayroll(true);
    try {
      const data = await api.admin.getPayroll();
      setPayrolls(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayroll(false);
    }
  };

  // Fetch data on tab change
  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'leaves') fetchLeaves();
    if (activeTab === 'payroll') fetchPayroll();
  }, [activeTab]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEmployee(true);
    setCreateError('');
    setCreatedCreds(null);

    try {
      const creds = await api.admin.createEmployee({
        name: empName,
        email: empEmail,
        phone: empPhone,
        date_of_joining: empDoj,
        salary: parseFloat(empSalary),
        address: empAddress
      });
      setCreatedCreds(creds);
      // Reset form
      setEmpName('');
      setEmpEmail('');
      setEmpPhone('');
      setEmpDoj('');
      setEmpSalary('');
      setEmpAddress('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create employee.');
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleBlockEmployee = async (userId: string) => {
    if (!window.confirm("Are you sure you want to block this employee? This will prevent them from logging in.")) return;
    try {
      await api.admin.blockEmployee(userId);
      fetchEmployees();
    } catch (err) {
      alert("Failed to block user");
    }
  };

  const handleToggleAdminRole = async (userId: string, currentRole: string) => {
    const targetRole = currentRole === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN';
    if (!window.confirm(`Are you sure you want to change role to ${targetRole}?`)) return;
    try {
      await api.admin.updateRole(userId, targetRole);
      fetchEmployees();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const handleLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    const comment = leaveComment[leaveId] || '';
    setActingOnLeave(prev => ({ ...prev, [leaveId]: true }));
    try {
      await api.admin.actionLeave(leaveId, status, comment);
      fetchLeaves();
    } catch (err) {
      alert("Failed to update leave status");
    } finally {
      setActingOnLeave(prev => ({ ...prev, [leaveId]: false }));
    }
  };

  const startEditPayroll = (pay: any) => {
    setEditingPayrollUserId(pay.user_id);
    setEditBasic(pay.basic_salary.toString());
    setEditAllowances(pay.allowances.toString());
    setEditDeductions(pay.deductions.toString());
  };

  const handleUpdatePayroll = async (userId: string) => {
    setUpdatingPayroll(true);
    try {
      await api.admin.updatePayroll({
        user_id: userId,
        basic_salary: parseFloat(editBasic) || 0,
        allowances: parseFloat(editAllowances) || 0,
        deductions: parseFloat(editDeductions) || 0
      });
      setEditingPayrollUserId(null);
      fetchPayroll();
    } catch (err) {
      alert("Failed to update payroll");
    } finally {
      setUpdatingPayroll(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0b10]">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel m-4 mr-0 p-6 flex flex-col justify-between" style={{ borderRadius: '16px' }}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-900/40">
              D
            </div>
            <span className="text-lg font-bold tracking-tight text-white glow-text">Dayflow Admin</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'employees' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Users size={18} />
              Employees
            </button>
            
            <button 
              onClick={() => setActiveTab('add-employee')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'add-employee' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <UserPlus size={18} />
              Add Employee
            </button>

            <button 
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'leaves' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Calendar size={18} />
              Leave Requests
            </button>

            <button 
              onClick={() => setActiveTab('payroll')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'payroll' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <DollarSign size={18} />
              Payroll Control
            </button>
          </nav>
        </div>

        {/* User Info / Logout */}
        <div className="pt-6 border-t border-purple-900/15">
          <div className="text-left mb-4 px-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Logged In As</p>
            <p className="text-sm font-bold text-white truncate">{adminUser.name || 'Admin User'}</p>
            <p className="text-xs text-gray-400 truncate">{adminUser.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* TAB: Employees */}
        {activeTab === 'employees' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Active Directory</h1>
                <p className="text-gray-400 text-sm mt-1">Manage employees and monitor today's attendance.</p>
              </div>
            </div>

            {loadingEmployees ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-purple-500" size={36} />
              </div>
            ) : (
              <div className="glass-panel p-6">
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Today's Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp.id}>
                          <td className="font-mono text-purple-400 text-sm">{emp.employee_id}</td>
                          <td className="font-semibold text-white">{emp.name}</td>
                          <td>{emp.email}</td>
                          <td>{emp.phone}</td>
                          <td>
                            <span className={`badge ${emp.is_present_today ? 'badge-present' : 'badge-absent'}`}>
                              {emp.is_present_today ? 'PRESENT' : 'ABSENT'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleToggleAdminRole(emp.id, emp.role)} 
                                className="btn btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                              >
                                Toggle Admin
                              </button>
                              <button 
                                onClick={() => handleBlockEmployee(emp.id)} 
                                className="btn btn-danger py-1 px-2.5 text-xs flex items-center gap-1"
                              >
                                <Ban size={12} />
                                Block
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {employees.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">No active employees found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Add Employee */}
        {activeTab === 'add-employee' && (
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Register Employee</h1>
            <p className="text-gray-400 text-sm mb-8">Add a new record. Credentials will be generated automatically.</p>

            {createdCreds && (
              <div className="glass-panel p-6 border-emerald-500/20 bg-emerald-500/5 mb-8 text-left pulse-border">
                <div className="flex gap-3 mb-4">
                  <CheckCircle className="text-emerald-500 shrink-0" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-white">Employee Registered Successfully</h3>
                    <p className="text-sm text-gray-400">Share these login credentials with the employee. Write them down as they won't show again.</p>
                  </div>
                </div>
                <div className="bg-[#0f1016] border border-white/5 rounded-lg p-4 font-mono text-sm flex flex-col gap-2">
                  <p><span className="text-gray-500">Login ID / Username:</span> <span className="text-purple-400 font-bold">{createdCreds.employee_id}</span></p>
                  <p><span className="text-gray-500">Email:</span> <span className="text-white">{createdCreds.email}</span></p>
                  <p><span className="text-gray-500">Password:</span> <span className="text-emerald-400 font-bold">{createdCreds.password}</span></p>
                </div>
                <button onClick={() => setCreatedCreds(null)} className="btn btn-primary mt-4 py-1.5 px-4 text-sm">
                  Dismiss
                </button>
              </div>
            )}

            <div className="glass-panel p-8">
              <form onSubmit={handleCreateEmployee} className="flex flex-col gap-5">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-name">Employee Full Name *</label>
                    <input 
                      id="emp-name" 
                      type="text" 
                      className="form-input" 
                      placeholder="John Doe" 
                      value={empName} 
                      onChange={e => setEmpName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-email">Email Address *</label>
                    <input 
                      id="emp-email" 
                      type="email" 
                      className="form-input" 
                      placeholder="john.doe@example.com" 
                      value={empEmail} 
                      onChange={e => setEmpEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-phone">Phone Number *</label>
                    <input 
                      id="emp-phone" 
                      type="text" 
                      className="form-input" 
                      placeholder="+919876543210" 
                      value={empPhone} 
                      onChange={e => setEmpPhone(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-doj">Date of Joining *</label>
                    <input 
                      id="emp-doj" 
                      type="date" 
                      className="form-input" 
                      value={empDoj} 
                      onChange={e => setEmpDoj(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp-salary">Basic Monthly Salary (INR) *</label>
                  <input 
                    id="emp-salary" 
                    type="number" 
                    className="form-input" 
                    placeholder="45000" 
                    value={empSalary} 
                    onChange={e => setEmpSalary(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp-address">Residential Address *</label>
                  <textarea 
                    id="emp-address" 
                    className="form-input min-h-[80px]" 
                    placeholder="Apartment, Street, City" 
                    value={empAddress} 
                    onChange={e => setEmpAddress(e.target.value)} 
                    required 
                  />
                </div>

                {createError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 font-medium">
                    {createError}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
                  disabled={creatingEmployee}
                >
                  {creatingEmployee ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      Creating Account...
                    </>
                  ) : (
                    'Add Employee & Generate Credentials'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: Leave Requests */}
        {activeTab === 'leaves' && (
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Leave Administration</h1>
            <p className="text-gray-400 text-sm mb-8">Manage incoming leave requests generated over the last 3 days.</p>

            {loadingLeaves ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-purple-500" size={36} />
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                
                {/* Section: Pending Leaves */}
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
                    To Be Approved
                  </h2>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Duration</th>
                          <th>Reason</th>
                          <th>Admin comment</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leavesData.to_be_approved.map(leave => (
                          <tr key={leave.id}>
                            <td className="font-semibold text-white">{leave.employee_name}</td>
                            <td><span className="badge badge-warning">{leave.leave_type}</span></td>
                            <td className="text-sm">
                              {leave.start_date} to {leave.end_date} <br />
                              <span className="text-purple-400 font-medium">({leave.duration_days} days)</span>
                            </td>
                            <td className="max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                            <td>
                              <input 
                                type="text"
                                className="form-input py-1.5 px-3 text-xs"
                                placeholder="Decision reason..."
                                value={leaveComment[leave.id] || ''}
                                onChange={e => setLeaveComment(prev => ({ ...prev, [leave.id]: e.target.value }))}
                              />
                            </td>
                            <td>
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                                  disabled={actingOnLeave[leave.id]}
                                  className="btn btn-primary py-1.5 px-3 text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 shadow-none"
                                >
                                  {actingOnLeave[leave.id] ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                                  disabled={actingOnLeave[leave.id]}
                                  className="btn btn-danger py-1.5 px-3 text-xs flex items-center gap-1"
                                >
                                  {actingOnLeave[leave.id] ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {leavesData.to_be_approved.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-500">No pending leave requests.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section: Actioned Leaves */}
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-400">Decision History</h2>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Duration</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leavesData.decision_taken.map(leave => (
                          <tr key={leave.id}>
                            <td className="font-semibold text-white">{leave.employee_name}</td>
                            <td><span className="badge badge-warning">{leave.leave_type}</span></td>
                            <td className="text-sm">
                              {leave.start_date} to {leave.end_date} <br />
                              <span className="text-purple-400 font-medium">({leave.duration_days} days)</span>
                            </td>
                            <td className="max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                            <td>
                              <span className={`badge ${leave.status === 'APPROVED' ? 'badge-present' : 'badge-absent'}`}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {leavesData.decision_taken.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-500">No leave decision history.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB: Payroll Control */}
        {activeTab === 'payroll' && (
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Payroll Administration</h1>
            <p className="text-gray-400 text-sm mb-8">Review employee salary structures and customize allowances and deductions.</p>

            {loadingPayroll ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-purple-500" size={36} />
              </div>
            ) : (
              <div className="glass-panel p-6">
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Basic (INR)</th>
                        <th>Allowances</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrolls.map(pay => {
                        const isEditing = editingPayrollUserId === pay.user_id;
                        return (
                          <tr key={pay.user_id}>
                            <td className="font-mono text-purple-400 text-sm">{pay.employee_id}</td>
                            <td className="font-semibold text-white">{pay.name}</td>
                            
                            {/* Basic Salary */}
                            <td>
                              {isEditing ? (
                                <input 
                                  type="number"
                                  className="form-input py-1 px-2 text-sm max-w-[100px]"
                                  value={editBasic}
                                  onChange={e => setEditBasic(e.target.value)}
                                />
                              ) : (
                                `₹${pay.basic_salary.toLocaleString()}`
                              )}
                            </td>

                            {/* Allowances */}
                            <td>
                              {isEditing ? (
                                <input 
                                  type="number"
                                  className="form-input py-1 px-2 text-sm max-w-[100px]"
                                  value={editAllowances}
                                  onChange={e => setEditAllowances(e.target.value)}
                                />
                              ) : (
                                `₹${pay.allowances.toLocaleString()}`
                              )}
                            </td>

                            {/* Deductions */}
                            <td>
                              {isEditing ? (
                                <input 
                                  type="number"
                                  className="form-input py-1 px-2 text-sm max-w-[100px]"
                                  value={editDeductions}
                                  onChange={e => setEditDeductions(e.target.value)}
                                />
                              ) : (
                                `₹${pay.deductions.toLocaleString()}`
                              )}
                            </td>

                            {/* Net Salary */}
                            <td className="font-bold text-emerald-400">
                              {isEditing ? (
                                <span className="text-gray-500 text-xs font-normal">Calculated upon save</span>
                              ) : (
                                `₹${pay.net_salary.toLocaleString()}`
                              )}
                            </td>

                            {/* Actions */}
                            <td>
                              {isEditing ? (
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => handleUpdatePayroll(pay.user_id)}
                                    disabled={updatingPayroll}
                                    className="btn btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 shadow-none flex items-center gap-1"
                                  >
                                    {updatingPayroll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Save
                                  </button>
                                  <button 
                                    onClick={() => setEditingPayrollUserId(null)}
                                    disabled={updatingPayroll}
                                    className="btn btn-secondary py-1.5 px-3 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => startEditPayroll(pay)}
                                  className="btn btn-secondary py-1 px-3 text-xs"
                                >
                                  Edit Structure
                                </button>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                      {payrolls.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">No payroll structures initialized.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
}
