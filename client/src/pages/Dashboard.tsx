import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  Users, Calendar, DollarSign, LogOut, Loader2, 
  CheckCircle, UserPlus
} from 'lucide-react';

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState<'none' | 'leaves' | 'payroll' | 'add-employee'>('none');
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [leavesData, setLeavesData] = useState<{ decision_taken: any[], to_be_approved: any[] }>({ decision_taken: [], to_be_approved: [] });
  
  // Loading states
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
    if (!adminUser.role || adminUser.role !== 'ADMIN') {
      navigate('/login');
    }
  }, [navigate]);

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

  useEffect(() => {
    if (activePanel === 'leaves') fetchLeaves();
    if (activePanel === 'payroll') fetchPayroll();
  }, [activePanel]);

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
    <div className="min-h-screen bg-[#0a0b10] flex flex-col p-6" style={{ background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.04), transparent 50%)' }}>
      
      {/* Header Panel */}
      <header className="glass-panel w-full p-6 flex items-center justify-between mb-8" style={{ borderRadius: '16px' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-md">
            D
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight glow-text">Dayflow Workplace</h1>
            <p className="text-xs text-gray-400">Admin Control Center</p>
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-400">
          <p className="font-bold text-white">{adminUser.name}</p>
          <p className="text-xs text-purple-400">System Administrator</p>
        </div>
      </header>

      {/* Main Overhaul Landing Dashboard */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
        
        {/* 4 Control Buttons Landing Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          {/* Button 1: Display Employee List */}
          <button 
            onClick={() => navigate('/employees')}
            className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 border border-purple-500/10 hover:border-purple-500/30 glow-box group"
            style={{ borderRadius: '16px' }}
          >
            <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <Users size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Employee List</h3>
              <p className="text-xs text-gray-500 mt-1">View directory & attendance</p>
            </div>
          </button>

          {/* Button 2: Display Leave Requests */}
          <button 
            onClick={() => setActivePanel(activePanel === 'leaves' ? 'none' : 'leaves')}
            className={`glass-card p-6 flex flex-col items-center justify-center text-center gap-4 border hover:border-purple-500/30 glow-box group ${activePanel === 'leaves' ? 'border-purple-500 bg-purple-600/10 shadow-lg shadow-purple-900/10' : 'border-purple-500/10'}`}
            style={{ borderRadius: '16px' }}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${activePanel === 'leaves' ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white'}`}>
              <Calendar size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Leave Requests</h3>
              <p className="text-xs text-gray-500 mt-1">Approve pending applications</p>
            </div>
          </button>

          {/* Button 3: Display Employee Records (Payroll) */}
          <button 
            onClick={() => setActivePanel(activePanel === 'payroll' ? 'none' : 'payroll')}
            className={`glass-card p-6 flex flex-col items-center justify-center text-center gap-4 border hover:border-purple-500/30 glow-box group ${activePanel === 'payroll' ? 'border-purple-500 bg-purple-600/10 shadow-lg shadow-purple-900/10' : 'border-purple-500/10'}`}
            style={{ borderRadius: '16px' }}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${activePanel === 'payroll' ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white'}`}>
              <DollarSign size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Employee Records</h3>
              <p className="text-xs text-gray-500 mt-1">Review payroll & salaries</p>
            </div>
          </button>

          {/* Button 4: Sign Out / Logout */}
          <button 
            onClick={handleLogout}
            className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/5 group"
            style={{ borderRadius: '16px' }}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
              <LogOut size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Sign Out</h3>
              <p className="text-xs text-gray-500 mt-1">Clear session & cookies</p>
            </div>
          </button>

        </section>

        {/* Sub-action: Add Employee Quick Trigger (keeps layout complete) */}
        {activePanel === 'none' && (
          <section className="flex justify-end">
            <button 
              onClick={() => setActivePanel('add-employee')}
              className="btn btn-primary flex items-center gap-2 py-2 px-5 text-sm"
            >
              <UserPlus size={16} />
              Register New Employee
            </button>
          </section>
        )}

        {/* PANEL: Leave Requests */}
        {activePanel === 'leaves' && (
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Leave Requests (Last 3 Days)</h2>
              <button onClick={() => setActivePanel('none')} className="btn btn-secondary py-1 px-3 text-xs">Close</button>
            </div>

            {loadingLeaves ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* To Be Approved Table */}
                <div>
                  <h3 className="text-sm font-bold text-yellow-500 mb-3 uppercase tracking-wider">To Be Approved</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Duration</th>
                          <th>Reason</th>
                          <th>Comment</th>
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
                                  className="btn btn-primary py-1 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 shadow-none flex items-center gap-1"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                                  disabled={actingOnLeave[leave.id]}
                                  className="btn btn-danger py-1 px-2.5 text-xs"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {leavesData.to_be_approved.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-gray-500">No pending leave requests.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* History Table */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Decision History</h3>
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
                            <td colSpan={5} className="text-center py-6 text-gray-500">No leave decision history.</td>
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

        {/* PANEL: Employee Records (Payroll) */}
        {activePanel === 'payroll' && (
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Employee Payroll Records</h2>
              <button onClick={() => setActivePanel('none')} className="btn btn-secondary py-1 px-3 text-xs">Close</button>
            </div>

            {loadingPayroll ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Basic Salary</th>
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
                          <td>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="form-input py-1 px-2 text-xs max-w-[100px]" 
                                value={editBasic}
                                onChange={e => setEditBasic(e.target.value)}
                              />
                            ) : (
                              `₹${pay.basic_salary.toLocaleString()}`
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="form-input py-1 px-2 text-xs max-w-[100px]" 
                                value={editAllowances}
                                onChange={e => setEditAllowances(e.target.value)}
                              />
                            ) : (
                              `₹${pay.allowances.toLocaleString()}`
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="form-input py-1 px-2 text-xs max-w-[100px]" 
                                value={editDeductions}
                                onChange={e => setEditDeductions(e.target.value)}
                              />
                            ) : (
                              `₹${pay.deductions.toLocaleString()}`
                            )}
                          </td>
                          <td className="font-bold text-emerald-400">
                            {isEditing ? 'Calculated' : `₹${pay.net_salary.toLocaleString()}`}
                          </td>
                          <td>
                            {isEditing ? (
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleUpdatePayroll(pay.user_id)}
                                  disabled={updatingPayroll}
                                  className="btn btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 shadow-none flex items-center gap-1"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingPayrollUserId(null)}
                                  className="btn btn-secondary py-1.5 px-3 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => startEditPayroll(pay)}
                                className="btn btn-secondary py-1 px-2.5 text-xs"
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
                        <td colSpan={7} className="text-center py-6 text-gray-500">No payroll structures initialized.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL: Register Employee */}
        {activePanel === 'add-employee' && (
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Register Employee Record</h2>
              <button onClick={() => { setActivePanel('none'); setCreatedCreds(null); }} className="btn btn-secondary py-1 px-3 text-xs">Close</button>
            </div>

            {createdCreds && (
              <div className="glass-panel p-6 border-emerald-500/20 bg-emerald-500/5 mb-8 text-left pulse-border">
                <div className="flex gap-3 mb-4">
                  <CheckCircle className="text-emerald-500 shrink-0" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-white">Employee Registered Successfully</h3>
                    <p className="text-sm text-gray-400">Share these generated login credentials with the employee.</p>
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

            <div className="glass-panel p-6">
              <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4 text-left">
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
                    className="form-input min-h-[60px]" 
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

      </div>

    </div>
  );
}
