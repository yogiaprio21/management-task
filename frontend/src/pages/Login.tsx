import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, KanbanSquare, Lock, Mail, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1fr_430px] lg:items-stretch">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8 lg:flex lg:flex-col lg:justify-between">
          <Logo size={42} />
          <div className="mt-10 max-w-2xl lg:mt-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
              <ShieldCheck className="h-4 w-4" />
              Workspace access control
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Kelola pekerjaan personal dan tim dalam workspace yang terpisah.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              TaskFlow menggabungkan project, backlog, sprint board, task pribadi, audit log, dan integrasi webhook dalam satu produk portfolio yang rapi dan aman.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              ['Workspace', 'Personal dan team scope'],
              ['Kanban', 'Sprint dan task tracking'],
              ['Audit', 'Riwayat perubahan jelas'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <KanbanSquare className="mb-3 h-5 w-5 text-primary" />
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <Card hover={false} className="p-6 md:p-8">
              <div className="mb-8">
                <Logo size={44} showText={false} />
                <h2 className="mt-5 text-2xl font-bold text-slate-950 dark:text-slate-50">Sign in</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Continue to your planning workspace.</p>
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
                  className="absolute right-2 top-8 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
              <Link to="/preview" className="font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                Preview
              </Link>
            </div>
          </Card>
        </motion.div>
      </section>
      </div>
    </div>
  );
};

export default Login;
