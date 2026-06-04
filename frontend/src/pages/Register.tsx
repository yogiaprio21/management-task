import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import Logo from '../components/Logo';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const errors = useMemo(() => ({
    name: submitted && name.trim().length < 2 ? 'Name must be at least 2 characters.' : '',
    email: submitted && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email address.' : '',
    password: submitted && password.length < 6 ? 'Password must be at least 6 characters.' : '',
  }), [email, name, password, submitted]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.name || errors.email || errors.password || !name || !email || !password) return;

    setIsLoading(true);
    try {
      await register({ name, email, password });
      toast.success(isAuthenticated ? 'User created successfully' : 'Registration successful. Please sign in.');
      setName('');
      setEmail('');
      setPassword('');
      navigate(isAuthenticated ? '/' : '/login', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card hover={false} className="p-6 md:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size={56} showText={false} />
            <h2 className="mt-5 text-2xl font-bold text-slate-950">{isAuthenticated ? 'Add team member' : 'Create account'}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {isAuthenticated ? 'Create an account for a collaborator.' : 'Start managing tasks, sprints, and project reports.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="name"
              label="Full name"
              placeholder="Yogi Aprio"
              icon={<UserIcon className="h-5 w-5" />}
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
              autoComplete="name"
            />
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
                placeholder="Minimum 6 characters"
                icon={<Lock className="h-5 w-5" />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
                autoComplete="new-password"
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
              {isAuthenticated ? 'Create User' : 'Sign Up'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {!isAuthenticated && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
