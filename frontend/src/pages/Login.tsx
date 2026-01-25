import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth';
import { Lock, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const data = await loginApi({ email, password });
      await login(data.access_token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to manage your tasks</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {/* Demo Credentials Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">Demo Credentials</h3>
          <div className="grid gap-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <span className="font-medium text-gray-600">Admin</span>
              <div className="text-right">
                <div className="text-gray-800">admin@example.com</div>
                <div className="text-gray-500">password123</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <span className="font-medium text-gray-600">Manager</span>
              <div className="text-right">
                <div className="text-gray-800">manager@example.com</div>
                <div className="text-gray-500">password123</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <span className="font-medium text-gray-600">Staff</span>
              <div className="text-right">
                <div className="text-gray-800">dev@example.com</div>
                <div className="text-gray-500">password123</div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Login;