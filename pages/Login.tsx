import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart2, Loader2, AlertCircle, Lock, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError("Please fill in all fields");
        return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
        await login(email, password);
        navigate('/');
    } catch (err) {
        setError("Invalid email or password");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Section - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo Mobile */}
            <div className="lg:hidden flex items-center gap-2 text-indigo-600 mb-10">
                <BarChart2 className="w-8 h-8" />
                <span className="font-bold text-xl tracking-tight">RIP AI</span>
            </div>

            <div>
               <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
               <p className="mt-2 text-sm text-gray-500">
                 Please enter your credentials to access the dashboard.
               </p>
            </div>

            <div className="mt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                            Email address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div>
                         <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 border border-red-100 animate-fade-in">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={clsx(
                                "w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all",
                                isSubmitting 
                                    ? "bg-indigo-400 cursor-not-allowed" 
                                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            )}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
                            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </form>

                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-all">
                            Create a new account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Right Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden justify-center items-center p-12">
           {/* Abstract Background */}
           <div className="absolute inset-0 bg-indigo-600">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
           </div>

           <div className="relative z-10 w-full max-w-md space-y-8">
                {/* Glassmorphism Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden">
                    {/* Decoration */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-white/20 rounded-lg">
                             <BarChart2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-wide">RIP AI</span>
                    </div>
                    
                    <h2 className="text-3xl font-bold leading-tight mb-4 relative z-10">
                        Intelligent Resume Parsing
                    </h2>
                    <p className="text-indigo-100 text-sm leading-relaxed opacity-90 mb-8 relative z-10">
                        An AI-powered, time-aware Resume Intelligence Platform with built-in Role Matching, Candidate Comparison and AI-generated Interview Questioning.
                    </p>

                    {/* Visual Widget: Match Score Simulation */}
                    <div className="bg-white/95 rounded-xl p-4 shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-500 text-gray-800 relative z-10 border border-white/50">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">JD</div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">John Doe</div>
                                    <div className="text-xs text-gray-500">Senior Engineer</div>
                                </div>
                            </div>
                            <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                                94% Match
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                <span>Skill Alignment</span>
                                <span>High</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[94%]"></div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">React</span>
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">Node.js</span>
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">AWS</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Floating pill */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900/30 backdrop-blur-sm rounded-full border border-indigo-500/30 text-xs text-indigo-200 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span>Trusted by Modern HR Teams</span>
                    </div>
                </div>
           </div>
      </div>
    </div>
  );
};

export default Login;