import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        <Card className="p-8 md:p-10 shadow-xl border-none">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Lock className="w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 mt-2 font-medium">Sign in to manage your tasks efficiently</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50 border-slate-200"
            />

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link to="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input
                type="password"
                required
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold"
              isLoading={isLoading}
            >
              {!isLoading && (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Create account
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Demo Accounts</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                type="button"
                onClick={() => { setEmail('admin@example.com'); setPassword('password123'); }}
                className="text-[11px] flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors group"
              >
                <span className="font-bold text-slate-600 group-hover:text-primary">Admin</span>
                <span className="text-slate-400">admin@example.com • password123</span>
              </button>
              <button 
                type="button"
                onClick={() => { setEmail('manager@example.com'); setPassword('password123'); }}
                className="text-[11px] flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors group"
              >
                <span className="font-bold text-slate-600 group-hover:text-primary">Manager</span>
                <span className="text-slate-400">manager@example.com • password123</span>
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;