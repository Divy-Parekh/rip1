import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart2, Loader2, AlertCircle, Lock, Mail, User, ArrowRight, Zap, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
        setError("Please fill in all fields");
        return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
        await register(name, email, password);
        navigate('/');
    } catch (err) {
        setError("Registration failed. Please try again.");
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
               <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
               <p className="mt-2 text-sm text-gray-500">
                  Join the intelligent recruitment revolution today.
               </p>
            </div>

            <div className="mt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

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
                                placeholder="john@example.com"
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
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                                placeholder="Create a strong password"
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
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
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
                            <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-all">
                           Sign in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Right Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden justify-center items-center p-12">
           {/* Abstract Background */}
           <div className="absolute inset-0 bg-slate-900">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[128px] opacity-20"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-20"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5"></div>
           </div>

           <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-indigo-400 mb-4">
                        <span>New v1.0 Released</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4">Smart Hiring Starts Here</h2>
                    <p className="text-slate-400 leading-relaxed">
                        An AI-powered, time-aware Resume Intelligence Platform with built-in Role Matching, Candidate Comparison and AI-generated Interview Questioning.
                    </p>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-2 gap-4 w-full">
                     <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 p-5 rounded-2xl hover:bg-slate-800 transition-colors group cursor-default">
                         <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 text-blue-400 group-hover:scale-110 transition-transform">
                             <Zap className="w-5 h-5" />
                         </div>
                         <div className="text-white font-semibold mb-1">Fast Parsing</div>
                         <div className="text-slate-500 text-xs">Instant structured data extraction.</div>
                     </div>
                     
                     <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 p-5 rounded-2xl hover:bg-slate-800 transition-colors group cursor-default">
                         <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3 text-purple-400 group-hover:scale-110 transition-transform">
                             <BrainCircuit className="w-5 h-5" />
                         </div>
                         <div className="text-white font-semibold mb-1">AI Interviews</div>
                         <div className="text-slate-500 text-xs">Auto-generated technical questions.</div>
                     </div>

                      <div className="col-span-2 bg-gradient-to-r from-indigo-600 to-blue-600 p-5 rounded-2xl shadow-xl transform hover:-translate-y-1 transition-transform duration-300 cursor-default">
                         <div className="flex items-center justify-between text-white mb-3">
                             <div className="font-medium flex items-center gap-2">
                                 Candidate Comparison
                             </div>
                             <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Feature</div>
                         </div>
                         <div className="flex items-center gap-3">
                             <div className="flex -space-x-3 overflow-hidden">
                                 <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-indigo-700 text-[10px] font-bold">JD</div>
                                 <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-purple-700 text-[10px] font-bold">AS</div>
                                 <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-blue-700 text-[10px] font-bold">MR</div>
                             </div>
                             <div className="text-indigo-100 text-xs">
                                Compare skills & experience side-by-side.
                             </div>
                         </div>
                     </div>
                </div>
           </div>
      </div>
    </div>
  );
};

export default Register;