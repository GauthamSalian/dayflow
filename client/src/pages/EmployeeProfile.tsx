import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, 
  DollarSign, Loader2, Clock, X
} from 'lucide-react';

export default function EmployeeProfile() {
  const { user_id } = useParams<{ user_id: string }>();
  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  
  // Edit Form Dialog State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Duration stats filter state
  const [durationFilter, setDurationFilter] = useState<'1w' | '1m' | '3m' | '1y'>('1y');

  useEffect(() => {
    if (!adminUser.role || adminUser.role !== 'ADMIN') {
      navigate('/login');
    } else if (user_id) {
      fetchProfileData();
    }
  }, [user_id, navigate]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      if (user_id) {
        const data = await api.admin.getEmployeeProfileDetail(user_id);
        setProfileData(data);
        
        // Prep edit fields
        if (data && data.profile) {
          setEditName(data.profile.name || '');
          setEditPhone(data.profile.phone || '');
          setEditAddress(data.profile.address || '');
          setEditSalary(data.payroll.basic_salary.toString() || '0');
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user_id) return;
    setSavingEdit(true);
    setEditError('');

    try {
      await api.admin.editEmployee(user_id, {
        name: editName,
        phone: editPhone,
        address: editAddress,
        salary: parseFloat(editSalary) || 0
      });
      setShowEditModal(false);
      fetchProfileData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update employee details.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  if (!profileData) return null;

  const { profile, payroll, attendance, leaves } = profileData;

  // GitHub contribution graph dates generator
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const contributionDays: { date: string; status: 'PRESENT' | 'ABSENT' | 'UNLOGGED' }[] = [];
  
  // Fill all 365 days of the year
  for (let i = 0; i < 365; i++) {
    const tempDate = new Date(startDate);
    tempDate.setDate(startDate.getDate() + i);
    if (tempDate.getFullYear() !== currentYear) break;
    
    const dateStr = tempDate.toISOString().split('T')[0];
    const log = attendance.find((a: any) => a.date === dateStr);
    
    let dayStatus: 'PRESENT' | 'ABSENT' | 'UNLOGGED' = 'UNLOGGED';
    if (log) {
      dayStatus = (log.status === 'PRESENT' || log.status === 'HALF_DAY') ? 'PRESENT' : 'ABSENT';
    }
    contributionDays.push({ date: dateStr, status: dayStatus });
  }

  // Duration Filter Calculation Stats
  const getStatsForDuration = (filter: '1w' | '1m' | '3m' | '1y') => {
    const today = new Date();
    const limitDate = new Date();

    if (filter === '1w') limitDate.setDate(today.getDate() - 7);
    else if (filter === '1m') limitDate.setMonth(today.getMonth() - 1);
    else if (filter === '3m') limitDate.setMonth(today.getMonth() - 3);
    else if (filter === '1y') limitDate.setFullYear(today.getFullYear() - 1);

    const doj = profile.date_of_joining ? new Date(profile.date_of_joining) : null;
    const startOfRange = doj && doj > limitDate ? doj : limitDate;
    
    // Total calendar days
    const totalDays = Math.max(1, Math.round((today.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Count presentation days within range
    const logsInRange = attendance.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= startOfRange && logDate <= today;
    });
    
    const attended = logsInRange.filter((log: any) => log.status === 'PRESENT' || log.status === 'HALF_DAY').length;
    const rate = Math.round((attended / totalDays) * 100);

    return { totalDays, attended, rate };
  };

  const currentStats = getStatsForDuration(durationFilter);

  // Group Leaves
  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING');
  const acceptedLeaves = leaves.filter((l: any) => l.status === 'APPROVED' || l.status === 'REJECTED');

  return (
    <div className="min-h-screen bg-[#0a0b10] flex flex-col p-6" style={{ background: 'radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.05), transparent 45%)' }}>
      
      {/* Navigation Header */}
      <header className="glass-panel w-full p-6 flex items-center justify-between mb-8" style={{ borderRadius: '16px' }}>
        <div className="flex items-center gap-4">
          <Link to="/employees" className="btn btn-secondary p-2.5 rounded-xl">
            <ArrowLeft size={18} />
          </Link>
          <div className="text-left">
            <h1 className="text-xl font-bold text-white tracking-tight">Employee Portfolio</h1>
            <p className="text-xs text-gray-400">Detailed performance logs and profile settings</p>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* Left Side: Profile Summary & Salary */}
        <section className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Profile Card */}
          <div className="glass-panel p-6 relative">
            <button 
              onClick={() => setShowEditModal(true)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 text-purple-400 transition-all"
            >
              <Edit size={16} />
            </button>

            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-sm mt-4">
              <span className="text-2xl font-bold">{profile.name ? profile.name.slice(0, 2).toUpperCase() : 'EP'}</span>
            </div>
            
            <h2 className="text-xl font-bold text-white text-left">{profile.name}</h2>
            <p className="font-mono text-xs text-purple-400 bg-purple-500/10 rounded px-2 py-0.5 inline-block mt-2 mb-6">
              ID: {profile.employee_id}
            </p>

            <div className="flex flex-col gap-3.5 text-left border-t border-purple-900/15 pt-6 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-purple-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-purple-400 shrink-0" />
                <span>{profile.phone || 'Not Specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-purple-400 shrink-0" />
                <span className="truncate">{profile.address || 'Not Specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-purple-400 shrink-0" />
                <span>Joined: {profile.date_of_joining || 'Not Specified'}</span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown Card */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <DollarSign size={18} className="text-purple-400" />
              Payroll Configuration
            </h3>
            <div className="flex flex-col gap-3.5 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span className="text-white">₹{payroll.basic_salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Allowances</span>
                <span className="text-white">₹{payroll.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Deductions</span>
                <span className="text-white">₹{payroll.deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-purple-900/15 pt-3.5 text-base">
                <span className="text-white">Net Salary</span>
                <span className="text-emerald-400 font-bold">₹{payroll.net_salary.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Contribution Graph, Duration stats, Leaves */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          
          {/* GitHub Style Attendance Graph */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
              <Clock size={18} className="text-purple-400" />
              Attendance logs ({currentYear})
            </h3>
            <p className="text-xs text-gray-500 mb-6">Chronological attendance map (green = present, red = absent, grey = unlogged)</p>
            
            <div className="flex justify-center overflow-x-auto py-2">
              <div 
                className="grid gap-1"
                style={{ 
                  gridAutoFlow: 'column', 
                  gridTemplateRows: 'repeat(7, 1fr)',
                  maxHeight: '110px'
                }}
              >
                {contributionDays.map((day, idx) => {
                  let bgColor = 'bg-white/5';
                  if (day.status === 'PRESENT') bgColor = 'bg-emerald-500 shadow-sm shadow-emerald-500/25';
                  if (day.status === 'ABSENT') bgColor = 'bg-red-500/20 border border-red-500/40';

                  return (
                    <div 
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${bgColor}`}
                      title={`${day.date}: ${day.status}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-end gap-4 text-xs text-gray-500 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-white/5" /> Unlogged
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/40" /> Absent
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Present
              </div>
            </div>
          </div>

          {/* Stats Summary & Filters */}
          <div className="glass-panel p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-bold text-white">Attendance Analytics</h3>
              
              {/* Filter Tabs */}
              <div className="flex bg-[#0f1016] border border-white/5 rounded-lg p-1 text-xs">
                {(['1w', '1m', '3m', '1y'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setDurationFilter(f)}
                    className={`px-3 py-1.5 rounded-md font-medium uppercase transition-all ${durationFilter === f ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {f === '1w' && '1 Week'}
                    {f === '1m' && '1 Month'}
                    {f === '3m' && '3 Months'}
                    {f === '1y' && '1 Year'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-3">
              <div className="p-4 bg-[#0f1016] border border-white/5 rounded-xl text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tracked Calendar Days</p>
                <p className="text-2xl font-bold text-white mt-1">{currentStats.totalDays} Days</p>
              </div>
              <div className="p-4 bg-[#0f1016] border border-white/5 rounded-xl text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Clock-ins</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{currentStats.attended} Days</p>
              </div>
              <div className="p-4 bg-[#0f1016] border border-white/5 rounded-xl text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{isNaN(currentStats.rate) ? 0 : currentStats.rate}%</p>
              </div>
            </div>
          </div>

          {/* Leaves lists */}
          <div className="grid-2">
            
            {/* Pending Leave Requests */}
            <div className="glass-panel p-5">
              <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Pending Requests ({pendingLeaves.length})
              </h4>
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {pendingLeaves.map((leave: any) => (
                  <div key={leave.id} className="p-3 bg-[#0f1016] border border-white/5 rounded-lg text-xs flex flex-col gap-1 text-left">
                    <p className="font-semibold text-white">{leave.leave_type} Leave</p>
                    <p className="text-purple-400 font-medium">{leave.start_date} to {leave.end_date}</p>
                    <p className="text-gray-500 italic mt-1 font-sans">"{leave.reason}"</p>
                  </div>
                ))}
                {pendingLeaves.length === 0 && (
                  <p className="text-xs text-gray-500 py-4 text-center">No pending leave requests.</p>
                )}
              </div>
            </div>

            {/* Decided Leave History */}
            <div className="glass-panel p-5">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                Decision Log
              </h4>
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {acceptedLeaves.map((leave: any) => (
                  <div key={leave.id} className="p-3 bg-[#0f1016] border border-white/5 rounded-lg text-xs flex flex-col gap-1 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{leave.leave_type} Leave</p>
                      <span className={`badge ${leave.status === 'APPROVED' ? 'badge-present' : 'badge-absent'} scale-90`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-purple-400 font-medium">{leave.start_date} to {leave.end_date}</p>
                    <p className="text-gray-500 italic mt-1">Reason: "{leave.reason}"</p>
                    {leave.admin_comment && (
                      <p className="text-gray-400 font-medium mt-1">Decision Comment: "{leave.admin_comment}"</p>
                    )}
                  </div>
                ))}
                {acceptedLeaves.length === 0 && (
                  <p className="text-xs text-gray-500 py-4 text-center">No leave decision history.</p>
                )}
              </div>
            </div>

          </div>

        </section>

      </div>

      {/* Edit Employee Modal Form */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-md glass-panel p-8 relative pulse-border" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-white mb-6 text-left">Edit Employee Portfolio</h3>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-left">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">Full Name *</label>
                <input 
                  id="edit-name"
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-phone">Phone Number *</label>
                <input 
                  id="edit-phone"
                  type="text"
                  className="form-input"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-address">Residential Address *</label>
                <textarea 
                  id="edit-address"
                  className="form-input min-h-[60px]"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-salary">Basic Monthly Salary (INR) *</label>
                <input 
                  id="edit-salary"
                  type="number"
                  className="form-input"
                  value={editSalary}
                  onChange={e => setEditSalary(e.target.value)}
                  required
                />
              </div>

              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  disabled={savingEdit}
                >
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
