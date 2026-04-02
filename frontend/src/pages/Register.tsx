import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register({ name, email, password });
      
      if (isAuthenticated) {
        toast.success('User created successfully.');
        setName('');
        setEmail('');
        setPassword('');
        navigate('/'); // Navigate to dashboard
      } else {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[100px]" />
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
              <UserIcon className="w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isAuthenticated ? 'Add New Member' : 'Create Account'}
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              {isAuthenticated ? 'Add a new member to your workspace' : 'Join us to manage your projects efficiently'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="John Doe"
              icon={<UserIcon className="w-5 h-5" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border-slate-200"
            />

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

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-50 border-slate-200"
            />

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold"
              isLoading={isLoading}
            >
              {!isLoading && (
                <>
                  {isAuthenticated ? 'Create User' : 'Sign Up'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {!isAuthenticated && (
            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
