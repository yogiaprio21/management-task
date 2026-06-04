import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const errors = useMemo(() => ({
    email: submitted && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email address.' : '',
    password: submitted && password.length < 6 ? 'Password must be at least 6 characters.' : '',
  }), [email, password, submitted]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.email || errors.password || !email || !password) return;

    setIsLoading(true);
    try {
      const data = await loginApi({ email, password });
      await login(data.access_token);
      toast.success('Welcome back');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSubmitted(false);
  };

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_480px]">
      <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo size={42} />
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">TaskFlow Workspace</p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">Manage individual work and team delivery from one clean board.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            A portfolio-ready project management system with RBAC, audit logs, sprint planning, reports, notifications, and integrations.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
          {['Scrum board', 'Audit trail', 'Discord webhooks'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-3 font-semibold">{item}</div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card hover={false} className="p-6 md:p-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <Logo size={56} showText={false} />
              <h2 className="mt-5 text-2xl font-bold text-slate-950">Sign in</h2>
              <p className="mt-2 text-sm text-slate-500">Continue to your planning workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-5 w-5" />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  icon={<Lock className="h-5 w-5" />}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  error={errors.password}
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-8 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign In
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link to="/register" className="font-semibold text-primary hover:underline">Create account</Link>
              <button type="button" onClick={() => setShowDemo((value) => !value)} className="font-semibold text-slate-500 hover:text-slate-900">
                Demo credentials
              </button>
            </div>

            {showDemo && (
              <div className="mt-5 grid gap-2 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setDemo('admin@example.com')} className="rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50">
                  <span className="font-bold text-slate-800">Admin</span>
                  <span className="ml-2 text-slate-500">admin@example.com</span>
                </button>
                <button type="button" onClick={() => setDemo('manager@example.com')} className="rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50">
                  <span className="font-bold text-slate-800">Manager</span>
                  <span className="ml-2 text-slate-500">manager@example.com</span>
                </button>
              </div>
            )}
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Login;
