'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, CheckSquare, MessageCircle, Grid } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            if (isLogin) {
                const loginFormData = new URLSearchParams();
                loginFormData.append('username', formData.email);
                loginFormData.append('password', formData.password);

                const response = await axios.post(`${apiUrl}/api/auth/login`, loginFormData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (response.data.access_token) {
                    localStorage.setItem('token', response.data.access_token);
                    router.push('/dashboard');
                }
            } else {
                const signupFormData = new FormData();
                signupFormData.append('email', formData.email);
                signupFormData.append('password', formData.password);
                signupFormData.append('full_name', formData.name);

                await axios.post(`${apiUrl}/api/auth/signup`, signupFormData);

                const loginFormData = new URLSearchParams();
                loginFormData.append('username', formData.email);
                loginFormData.append('password', formData.password);

                const loginResponse = await axios.post(`${apiUrl}/api/auth/login`, loginFormData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (loginResponse.data.access_token) {
                    localStorage.setItem('token', loginResponse.data.access_token);
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-5" style={{
            background: 'linear-gradient(127deg, #0f172a 0%, #1e293b 47%, #334155 100%)'
        }}>
            <div className="flex flex-col lg:flex-row max-w-[1100px] w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex-1 p-8 sm:p-10 lg:p-[60px_50px] text-white relative overflow-hidden" style={{
                    background: 'linear-gradient(165deg, #2563eb 0%, #1e40af 100%)'
                }}>
                    <div className="absolute top-[-50%] right-[-20%] w-[400px] h-[400px] bg-white/[0.08] rounded-full" />
                    <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] bg-white/[0.06] rounded-full" />

                    <div className="relative z-10">
                        <h1 className="text-2xl sm:text-[28px] font-bold mb-3 tracking-tight">AI Vision Platform</h1>
                        <p className="text-sm sm:text-[15px] opacity-90 leading-relaxed font-light">
                            Advanced object detection and intelligent analysis powered by state-of-the-art machine learning models
                        </p>
                    </div>

                    <div className="relative z-10 mt-6 sm:mt-10">
                        <div className="flex items-start mb-5 sm:mb-7">
                            <div className="w-12 h-10 sm:w-16 sm:h-12 bg-white/15 rounded-[10px] flex items-center justify-center mr-3 sm:mr-[18px] backdrop-blur-[10px] flex-shrink-0">
                                <CheckSquare className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-1.5">YOLO Object Detection</h3>
                                <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-light">
                                    Real-time object detection with industry-leading accuracy and performance metrics
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start mb-5 sm:mb-7">
                            <div className="w-12 h-10 sm:w-16 sm:h-12 bg-white/15 rounded-[10px] flex items-center justify-center mr-3 sm:mr-[18px] backdrop-blur-[10px] flex-shrink-0">
                                <MessageCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-1.5">AI-Powered Q&A</h3>
                                <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-light">
                                    Ask questions about detected objects using Gemini's advanced natural language understanding
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start mb-5 sm:mb-7">
                            <div className="w-12 h-10 sm:w-16 sm:h-12 bg-white/15 rounded-[10px] flex items-center justify-center mr-3 sm:mr-[18px] backdrop-blur-[10px] flex-shrink-0">
                                <Grid className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-1.5">Interactive Analysis</h3>
                                <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-light">
                                    Sortable results with detailed confidence scores and bounding box coordinates
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 sm:p-10 lg:p-[60px_50px] flex flex-col justify-center">
                    <div className="mb-6 sm:mb-9">
                        <h2 className="text-2xl sm:text-[32px] font-bold text-[#0f172a] mb-2 tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-sm sm:text-[15px] text-[#64748b]">
                            {isLogin ? 'Enter your credentials to access your account' : 'Sign up to start analyzing images with AI'}
                        </p>
                    </div>

                    <div className="flex gap-2 mb-6 sm:mb-8 bg-[#f1f5f9] p-1.5 rounded-[10px]">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-[7px] text-sm sm:text-[15px] font-semibold transition-all cursor-pointer ${isLogin ? 'bg-white text-[#2563eb] shadow-md' : 'bg-transparent text-[#64748b]'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-[7px] text-sm sm:text-[15px] font-semibold transition-all cursor-pointer ${!isLogin ? 'bg-white text-[#2563eb] shadow-md' : 'bg-transparent text-[#64748b]'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="mb-4 sm:mb-[22px]">
                                <label className="block text-xs sm:text-sm font-semibold text-[#334155] mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full py-3 sm:py-3.5 px-3 sm:px-4 pl-10 sm:pl-12 border-[1.5px] border-[#e2e8f0] rounded-[10px] text-sm sm:text-[15px] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mb-4 sm:mb-[22px]">
                            <label className="block text-xs sm:text-sm font-semibold text-[#334155] mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className="w-full py-3 sm:py-3.5 px-3 sm:px-4 pl-10 sm:pl-12 border-[1.5px] border-[#e2e8f0] rounded-[10px] text-sm sm:text-[15px] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4 sm:mb-[22px]">
                            <label className="block text-xs sm:text-sm font-semibold text-[#334155] mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                                    className="w-full py-3 sm:py-3.5 px-3 sm:px-4 pl-10 sm:pl-12 pr-10 sm:pr-12 border-[1.5px] border-[#e2e8f0] rounded-[10px] text-sm sm:text-[15px] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="mb-4 sm:mb-[22px]">
                                <label className="block text-xs sm:text-sm font-semibold text-[#334155] mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Confirm your password"
                                        className="w-full py-3 sm:py-3.5 px-3 sm:px-4 pl-10 sm:pl-12 pr-10 sm:pr-12 border-[1.5px] border-[#e2e8f0] rounded-[10px] text-sm sm:text-[15px] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                                        required={!isLogin}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isLogin && (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-6 gap-3 sm:gap-0">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 sm:w-[18px] sm:h-[18px] mr-2 cursor-pointer accent-[#2563eb]" />
                                    <span className="text-xs sm:text-sm text-[#475569] font-medium">Remember me</span>
                                </label>
                                <a href="#" className="text-xs sm:text-sm text-[#2563eb] font-semibold hover:text-[#1e40af] cursor-pointer">
                                    Forgot Password?
                                </a>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 sm:py-[15px] text-white border-none rounded-[10px] text-sm sm:text-base font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)]"
                            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}
                        >
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
