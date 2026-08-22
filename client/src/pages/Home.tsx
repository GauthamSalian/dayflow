import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  User, Calendar, DollarSign, LogOut, Clock, 
  MapPin, Phone, Mail, Award, CheckCircle, Play, Square 
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [status, setStatus] = useState<'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT'>('NOT_CLOCKED_IN');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const sessionUser = localStorage.getItem('user');
    if (!sessionUser) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(sessionUser);
    setUser(parsedUser);

    // Initialize mock logs
    setAttendanceLogs([
      { date: 'Yesterday', check_in: '09:00 AM', check_out: '05:00 PM', status: 'PRESENT' },
      { date: '2 days ago', check_in: '08:55 AM', check_out: '05:05 PM', status: 'PRESENT' },
      { date: '3 days ago', check_in: '09:02 AM', check_out: '01:00 PM', status: 'HALF_DAY' }
    ]);
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
    
    // Add to logs list
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

  if (!user) return null;

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
            
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-xs font-mono text-purple-400 bg-purple-500/10 rounded-full px-3 py-1 inline-block mt-2 mb-6">
              ID: {user.employee_id}
            </p>

            <div className="flex flex-col gap-4 text-left border-t border-purple-900/15 pt-6 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-purple-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-purple-400 shrink-0" />
                <span>{user.phone || 'Not Specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-purple-400 shrink-0" />
                <span className="truncate">{user.address || 'Not Specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Award size={16} className="text-purple-400 shrink-0" />
                <span>Role: {user.role}</span>
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
        </section>

        {/* Right Side: Operations */}
        <section className="md:col-span-2 flex flex-col gap-6">
          
          {/* Widget: Daily Attendance Clock-in */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <Clock size={18} className="text-purple-400" />
              Shift Attendance
            </h3>

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
            
            <form onSubmit={e => { e.preventDefault(); alert("Leave request submitted successfully!"); }} className="flex flex-col gap-4">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="leave-start">Start Date *</label>
                  <input id="leave-start" type="date" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="leave-end">End Date *</label>
                  <input id="leave-end" type="date" className="form-input" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="leave-reason">Reason *</label>
                <textarea id="leave-reason" className="form-input min-h-[60px]" placeholder="Brief explanation of your leave..." required />
              </div>

              <button type="submit" className="btn btn-primary self-end py-2 px-6 text-sm font-semibold">
                Submit Request
              </button>
            </form>
          </div>

        </section>

      </main>
    </div>
  );
}
