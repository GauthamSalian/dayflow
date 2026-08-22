import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.auth.login(loginId, password);
      
      if (response && response.success) {
        const user = response.user;
        // Save user details to localStorage
        localStorage.setItem("user", JSON.stringify(user));
        
        // Redirect based on role
        if (user.role === 'ADMIN') {
          navigate('/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        setError('Unsuccessful login. Check credentials.');
      }
    } catch (err: any) {
      console.error("Login failure:", err);
      setError('Unsuccessful login. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.08), transparent 60%)' }}>
      
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="btn btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md glass-panel p-8 text-center pulse-border" style={{ border: '1px solid rgba(139, 92, 246, 0.25)' }}>
        
        {/* App Logo */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl mx-auto mb-4 shadow-md shadow-purple-900/40">
          D
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400 text-sm mb-8">Sign in to your Dayflow workspace</p>

        <form onSubmit={handleLogin}>
          
          {/* Username/Email Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-id">Login ID or Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="login-id"
                type="text"
                className="form-input pl-10"
                placeholder="EMP-001 or admin@dayflow.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="password"
                type="password"
                className="form-input pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
