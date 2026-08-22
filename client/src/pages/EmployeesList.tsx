import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  Users, ArrowLeft, Mail, Phone, 
  UserCheck, UserX, User, Loader2
} from 'lucide-react';

export default function EmployeesList() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!adminUser.role || adminUser.role !== 'ADMIN') {
      navigate('/login');
    } else {
      fetchEmployees();
    }
  }, [navigate]);

  const fetchEmployees = async () => {
    setLoading(false);
    setLoading(true);
    try {
      const data = await api.admin.getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (emp: any) => {
    const today = new Date().toISOString().split('T')[0];
    const nextStatus = emp.is_present_today ? 'ABSENT' : 'PRESENT';
    
    setUpdatingId(emp.id);
    
    // Optimistic UI update
    setEmployees(prev => prev.map(item => {
      if (item.id === emp.id) {
        return { ...item, is_present_today: !item.is_present_today };
      }
      return item;
    }));

    try {
      await api.admin.markAttendanceManual({
        user_id: emp.id,
        date: today,
        status: nextStatus
      });
    } catch (err) {
      alert("Failed to update attendance status");
      // Rollback UI update
      setEmployees(prev => prev.map(item => {
        if (item.id === emp.id) {
          return { ...item, is_present_today: emp.is_present_today };
        }
        return item;
      }));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] flex flex-col p-6" style={{ background: 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.05), transparent 45%)' }}>
      
      {/* Header Navigation */}
      <header className="glass-panel w-full p-6 flex items-center justify-between mb-8" style={{ borderRadius: '16px' }}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="btn btn-secondary p-2.5 rounded-xl">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users size={20} className="text-purple-400" />
              Employee Directory
            </h1>
            <p className="text-xs text-gray-400">Manage daily records & views</p>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-purple-500" size={36} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(emp => (
              <div 
                key={emp.id} 
                className="glass-card p-6 flex flex-col justify-between border border-white/5"
                style={{ borderRadius: '16px' }}
              >
                <div>
                  {/* Name and ID */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white tracking-tight">{emp.name}</h3>
                      <p className="font-mono text-xs text-purple-400 bg-purple-500/10 rounded px-2 py-0.5 inline-block mt-1">
                        {emp.employee_id}
                      </p>
                    </div>

                    {/* Attendance Badge */}
                    <span className={`badge ${emp.is_present_today ? 'badge-present' : 'badge-absent'}`}>
                      {emp.is_present_today ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </div>

                  {/* Profile Contact Details */}
                  <div className="flex flex-col gap-2.5 text-sm text-gray-400 text-left border-t border-white/5 pt-4 mb-6">
                    <div className="flex items-center gap-2.5">
                      <Mail size={15} className="text-purple-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone size={15} className="text-purple-400 shrink-0" />
                      <span>{emp.phone || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleAttendance(emp)}
                    disabled={updatingId === emp.id}
                    className={`btn flex-1 py-2 px-3 text-xs flex items-center justify-center gap-1.5 ${emp.is_present_today ? 'btn-danger' : 'btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-none'}`}
                  >
                    {updatingId === emp.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : emp.is_present_today ? (
                      <>
                        <UserX size={13} />
                        Mark Absent
                      </>
                    ) : (
                      <>
                        <UserCheck size={13} />
                        Mark Present
                      </>
                    )}
                  </button>
                  
                  <Link 
                    to={`/employees/${emp.id}`} 
                    className="btn btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-1 hover:border-purple-500/50"
                  >
                    <User size={13} className="text-purple-400" />
                    Profile
                  </Link>
                </div>

              </div>
            ))}
            
            {employees.length === 0 && (
              <div className="col-span-full glass-panel p-12 text-center text-gray-500">
                No active employee records found. Register new staff members to get started.
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
