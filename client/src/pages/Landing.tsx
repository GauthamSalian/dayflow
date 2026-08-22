import { Link } from 'react-router-dom';
import { LogIn, Users, Calendar, DollarSign, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.08), transparent 40%)' }}>
      
      {/* Navigation Header */}
      <header className="glass-panel mx-4 mt-6 p-4 flex items-center justify-between" style={{ borderRadius: '16px' }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-md shadow-purple-900/40">
            D
          </div>
          <span className="text-xl font-bold tracking-tight text-white glow-text">Dayflow</span>
        </div>
        
        <Link to="/login" className="btn btn-secondary flex items-center gap-2 py-2 px-5 text-sm">
          <LogIn size={16} className="text-purple-400" />
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 tracking-wide uppercase mb-6 animate-pulse">
          ⚡ Modern HR Management Platform
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-none" style={{ fontSize: 'min(5vw, 68px)', letterSpacing: '-0.03em' }}>
          Dayflow Human Resource <br />
          <span className="bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent glow-text">
            Management System
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
          A seamless, security-focused system to log attendance, manage employee payrolls, coordinate leaves, and automate organizational workflows.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link to="/login" className="btn btn-primary flex items-center gap-2 text-base font-semibold px-8 py-3">
            Enter Workspace
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid-3 w-full">
          <div className="glass-card p-8 text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 shadow-sm">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Employee Directories</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Store and manage profiles securely, generate custom credentials automatically, and track daily attendance.
            </p>
          </div>

          <div className="glass-card p-8 text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 shadow-sm">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Leaves Workflow</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Coordinate and approve leave requests dynamically. Track pending and actioned leaves cleanly.
            </p>
          </div>

          <div className="glass-card p-8 text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 shadow-sm">
              <DollarSign size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Payroll & Salaries</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Define basic salaries, add custom allowances or deductions, and manage payroll transparency.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-purple-900/10 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Dayflow Systems. Built for high performance and premium design.
      </footer>
    </div>
  );
}
