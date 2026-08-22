import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  User, Calendar, DollarSign, LogOut, Clock, 
  MapPin, Phone, Mail, Award, CheckCircle, Play, Square, Lock
} from 'lucide-react';

export default function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [currentUser, setCurrentUser] = useState<any>(user);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [status, setStatus] = useState<'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT'>('NOT_CLOCKED_IN');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState<boolean>(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'PERSONAL',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [durationFilter, setDurationFilter] = useState<'1w' | '1m' | '3m' | '1y'>('1y');

  const navigate = useNavigate();

  const getStatsForDuration = (filter: '1w' | '1m' | '3m' | '1y') => {
    const today = new Date();
    const limitDate = new Date();

    if (filter === '1w') limitDate.setDate(today.getDate() - 7);
    else if (filter === '1m') limitDate.setMonth(today.getMonth() - 1);
    else if (filter === '3m') limitDate.setMonth(today.getMonth() - 3);
    else if (filter === '1y') limitDate.setFullYear(today.getFullYear() - 1);

    const doj = currentUser?.date_of_joining ? new Date(currentUser.date_of_joining) : null;
    const startOfRange = doj && doj > limitDate ? doj : limitDate;
    
    const totalDays = Math.max(1, Math.round((today.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    const logsInRange = attendanceLogs.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= startOfRange && logDate <= today;
    });
    
    const attended = logsInRange.filter((log: any) => log.status === 'PRESENT' || log.status === 'HALF_DAY').length;
    const rate = Math.round((attended / totalDays) * 100);

    return { totalDays, attended, rate };
  };

  const currentStats = getStatsForDuration(durationFilter);

  // GitHub contribution graph dates generator
  const currentYear = new Date().getFullYear();
  const startDateObj = new Date(currentYear, 0, 1);
  const contributionDays: { date: string; status: 'PRESENT' | 'ABSENT' | 'UNLOGGED' }[] = [];
  
  for (let i = 0; i < 365; i++) {
    const tempDate = new Date(startDateObj);
    tempDate.setDate(startDateObj.getDate() + i);
    if (tempDate.getFullYear() !== currentYear) break;
    
    const dateStr = tempDate.toISOString().split('T')[0];
    const log = attendanceLogs.find((a: any) => a.date === dateStr);
    
    let dayStatus: 'PRESENT' | 'ABSENT' | 'UNLOGGED' = 'UNLOGGED';
    if (log) {
      dayStatus = (log.status === 'PRESENT' || log.status === 'HALF_DAY') ? 'PRESENT' : 'ABSENT';
    }
    contributionDays.push({ date: dateStr, status: dayStatus });
  }

  // Split the 365 days into columns of weeks (7 days each)
  const columns: typeof contributionDays[] = [];
  for (let i = 0; i < contributionDays.length; i += 7) {
    columns.push(contributionDays.slice(i, i + 7));
  }
  
  const calendarQuarters = [
    { label: 'Q1 (Jan - Mar)', cols: columns.slice(0, 13) },
    { label: 'Q2 (Apr - Jun)', cols: columns.slice(13, 26) },
    { label: 'Q3 (Jul - Sep)', cols: columns.slice(26, 39) },
    { label: 'Q4 (Oct - Dec)', cols: columns.slice(39) }
  ];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await api.employee.changePassword(currentUser.id, {
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res && res.success) {
        setPasswordSuccess("Password updated successfully.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError("Failed to update password.");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const loadDashboardData = async (activeUser: any = user) => {
    if (!activeUser?.id) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileData, attendanceData, _attendanceStatsData, _leavesData, leaveBalanceData] = await Promise.all([
        api.employee.getProfile(activeUser.id),
        api.employee.getAttendance(activeUser.id),
        api.employee.getAttendanceStats(activeUser.id),
        api.employee.getLeaves(activeUser.id),
        api.employee.getLeaveBalance(activeUser.id)
      ]);

      setCurrentUser({ ...activeUser, ...profileData });
      setAttendanceLogs(Array.isArray(attendanceData) ? attendanceData : []);
      setLeaveBalance(leaveBalanceData || null);

      const today = new Date().toISOString().slice(0, 10);
      const todaysAttendance = Array.isArray(attendanceData)
        ? attendanceData.find((entry: any) => entry.date === today)
        : null;

      if (todaysAttendance?.status === 'PRESENT' || todaysAttendance?.status === 'HALF_DAY') {
        setStatus('CLOCKED_OUT');
        setClockInTime(todaysAttendance.check_in || null);
        setClockOutTime(todaysAttendance.check_out || null);
      } else if (todaysAttendance?.status === 'PENDING') {
        setStatus('CLOCKED_IN');
      } else {
        setStatus('NOT_CLOCKED_IN');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sessionUser = localStorage.getItem('user');
    if (!sessionUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(sessionUser);
    setCurrentUser(parsedUser);
    loadDashboardData(parsedUser);
  }, [navigate]);

  const handleClockIn = () => {
    const now = new Date();
    setClockInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setStatus('CLOCKED_IN');
  };

  const handleClockOut = () => {
    const now = new Date();
    setClockOutTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setStatus('CLOCKED_OUT');
    
    setAttendanceLogs(prev => [
      { date: 'Today', check_in: clockInTime, check_out: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'PRESENT' },
      ...prev
    ]);
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

  const handleLeaveChange = (field: string, value: string) => {
    setLeaveForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      navigate('/login');
      return;
    }

    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason.trim()) {
      setLeaveError('Please complete all required leave fields.');
      return;
    }

    setLeaveSubmitting(true);
    setLeaveError(null);

    try {
      await api.employee.applyLeave({
        user_id: user.id,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason
      });

      setLeaveForm({
        leave_type: 'PERSONAL',
        start_date: '',
        end_date: '',
        reason: ''
      });

      await loadDashboardData(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Leave request failed.';
      setLeaveError(message);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0a0b10] flex flex-col" style={{ background: 'radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.05), transparent 50%)' }}>
      
      {/* Header Banner */}
      <header className="glass-panel mx-4 mt-6 p-4 flex items-center justify-between" style={{ borderRadius: '16px' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            D
          </div>
          <span className="text-lg font-bold text-white glow-text">Dayflow Employee Portal</span>
        </div>
        
        <button onClick={handleLogout} className="btn btn-secondary flex items-center gap-2 py-1.5 px-4 text-xs font-medium hover:text-red-400">
          <LogOut size={14} />
          Sign Out
        </button>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Profile Information */}
        <section className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 text-center">
            
            {/* Profile Avatar */}
            <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4 shadow-sm">
              <User size={36} />
            </div>
            
            <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
            <p className="text-xs font-mono text-purple-400 bg-purple-500/10 rounded-full px-3 py-1 inline-block mt-2 mb-6">
              ID: {currentUser.employee_id}
            </p>

            <div className="flex flex-col gap-4 text-left border-t border-purple-900/15 pt-6 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-purple-400 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-purple-400 shrink-0" />
                <span>{currentUser.phone || 'Not Specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-purple-400 shrink-0" />
                <span className="truncate">{currentUser.address || 'Not Specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Award size={16} className="text-purple-400 shrink-0" />
                <span>Role: {currentUser.role}</span>
              </div>
            </div>
          </div>

          {/* Read-Only Payroll Card */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <DollarSign size={18} className="text-purple-400" />
              Salary & Benefits
            </h3>
            <p className="text-xs text-gray-500 mb-4">Your current payroll structure (Monthly)</p>
            <div className="flex flex-col gap-3 font-medium text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span className="text-white">₹45,000</span>
              </div>
              <div className="flex justify-between">
                <span>Allowances</span>
                <span className="text-white">₹3,000</span>
              </div>
              <div className="flex justify-between">
                <span>Deductions</span>
                <span className="text-white">₹1,000</span>
              </div>
              <div className="flex justify-between border-t border-purple-900/15 pt-3 text-base">
                <span className="text-white">Net Salary</span>
                <span className="text-emerald-400 font-bold">₹47,000</span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-panel p-6 mt-6">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-white text-left">
              <Lock size={18} className="text-purple-400" />
              Update Password
            </h3>
            <p className="text-xs text-gray-500 mb-6 text-left">Choose a strong, secure password.</p>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4 text-left">
              <div className="form-group mb-2">
                <label className="form-label" htmlFor="curr-pass">Current Password *</label>
                <input 
                  id="curr-pass"
                  type="password"
                  className="form-input py-2 px-3 text-sm"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group mb-2">
                <label className="form-label" htmlFor="new-pass">New Password *</label>
                <input 
                  id="new-pass"
                  type="password"
                  className="form-input py-2 px-3 text-sm"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group mb-2">
                <label className="form-label" htmlFor="conf-pass">Confirm New Password *</label>
                <input 
                  id="conf-pass"
                  type="password"
                  className="form-input py-2 px-3 text-sm"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              {passwordError && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                  {passwordSuccess}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-1.5"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Operations */}
        <section className="md:col-span-2 flex flex-col gap-6">
          
          {/* Widget: Daily Attendance Clock-in */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <Clock size={18} className="text-purple-400" />
              Shift Attendance
            </h3>

            {loading && (
              <p className="text-sm text-gray-400 mb-4">Loading attendance data...</p>
            )}

            {error && (
              <p className="text-sm text-red-400 mb-4">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-[#0f1016] border border-white/5 rounded-xl mb-6">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</p>
                <p className="text-lg font-bold text-white mt-1">
                  {status === 'NOT_CLOCKED_IN' && 'Not Checked In Yet'}
                  {status === 'CLOCKED_IN' && 'Shift in Progress'}
                  {status === 'CLOCKED_OUT' && 'Shift Completed'}
                </p>
                {clockInTime && (
                  <p className="text-xs text-gray-400 mt-1">
                    Clocked In: <span className="text-purple-400 font-bold">{clockInTime}</span> 
                    {clockOutTime && <> | Clocked Out: <span className="text-purple-400 font-bold">{clockOutTime}</span></>}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                {status === 'NOT_CLOCKED_IN' && (
                  <button onClick={handleClockIn} className="btn btn-primary py-3 px-6 flex items-center gap-2">
                    <Play size={16} />
                    Clock In
                  </button>
                )}
                {status === 'CLOCKED_IN' && (
                  <button onClick={handleClockOut} className="btn btn-danger py-3 px-6 flex items-center gap-2">
                    <Square size={16} />
                    Clock Out
                  </button>
                )}
                {status === 'CLOCKED_OUT' && (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-5 rounded-lg text-sm">
                    <CheckCircle size={16} />
                    Logged for Today
                  </div>
                )}
              </div>
            </div>

          {/* GitHub Style Attendance Graph (2x2 grid) */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2 text-left">
              <Clock size={18} className="text-purple-400" />
              Attendance Map ({currentYear})
            </h3>
            <p className="text-xs text-gray-500 mb-6 text-left">Chronological attendance map (green = present, red = absent, grey = unlogged)</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {calendarQuarters.map((row, rIdx) => (
                <div key={rIdx} className="p-4 bg-[#0f1016]/40 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold text-purple-400 mb-3 text-left">{row.label}</h4>
                  <div className="flex">
                    {/* Weekday labels */}
                    <div className="flex flex-col justify-between text-[9px] text-gray-500 pr-2 pt-5 pb-1 font-medium" style={{ height: '70px', minWidth: '24px' }}>
                      <span></span>
                      <span>Mon</span>
                      <span></span>
                      <span>Wed</span>
                      <span></span>
                      <span>Fri</span>
                      <span></span>
                    </div>
                    {/* Grid */}
                    <div 
                      className="grid gap-1"
                      style={{ 
                        gridAutoFlow: 'column', 
                        gridTemplateRows: 'repeat(7, 1fr)',
                        height: '70px'
                      }}
                    >
                      {row.cols.flatMap(col => col).map((day, idx) => {
                        let bgColor = 'bg-white/5';
                        if (day.status === 'PRESENT') bgColor = 'bg-emerald-500 shadow-sm shadow-emerald-500/25';
                        if (day.status === 'ABSENT') bgColor = 'bg-red-500/20 border border-red-500/40';

                        return (
                          <div 
                            key={idx}
                            className={`rounded-sm transition-all duration-300 ${bgColor}`}
                            style={{ width: '9px', height: '9px' }}
                            title={`${day.date}: ${day.status}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
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

          {/* Attendance Analytics Widget */}
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

          {/* Previous Logs */}
            <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Recent Activity Log</h4>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map((log, i) => (
                    <tr key={i}>
                      <td className="font-medium text-white">{log.date}</td>
                      <td>{log.check_in}</td>
                      <td>{log.check_out}</td>
                      <td>
                        <span className={`badge ${log.status === 'PRESENT' ? 'badge-present' : 'badge-warning'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Application Widget */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <Calendar size={18} className="text-purple-400" />
              Apply for Leave
            </h3>

            {leaveBalance && (
              <p className="text-xs text-gray-400 mb-4">
                Remaining leave balance: <span className="text-purple-400 font-bold">{leaveBalance.remaining_leave_balance}</span> / {leaveBalance.annual_leave_days} days
              </p>
            )}

            {leaveError && (
              <p className="text-sm text-red-400 mb-4">{leaveError}</p>
            )}
            
            <form onSubmit={handleLeaveSubmit} className="flex flex-col gap-4">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="leave-type">Leave Type</label>
                  <select
                    id="leave-type"
                    className="form-input"
                    value={leaveForm.leave_type}
                    onChange={(e) => handleLeaveChange('leave_type', e.target.value)}
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="SICK">Sick</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="leave-start">Start Date *</label>
                  <input
                    id="leave-start"
                    type="date"
                    className="form-input"
                    value={leaveForm.start_date}
                    onChange={(e) => handleLeaveChange('start_date', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="leave-end">End Date *</label>
                  <input
                    id="leave-end"
                    type="date"
                    className="form-input"
                    value={leaveForm.end_date}
                    onChange={(e) => handleLeaveChange('end_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="leave-reason">Reason *</label>
                <textarea
                  id="leave-reason"
                  className="form-input min-h-[60px]"
                  placeholder="Brief explanation of your leave..."
                  value={leaveForm.reason}
                  onChange={(e) => handleLeaveChange('reason', e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary self-end py-2 px-6 text-sm font-semibold" disabled={leaveSubmitting}>
                {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

        </section>

      </main>
    </div>
  );
}
