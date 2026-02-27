import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(identifier, password);
        if (!result.success) {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] relative overflow-hidden px-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-primary-500/40 rotate-12 hover:rotate-0 transition-transform duration-500 group cursor-pointer">
                        <Lock className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Transport Corporation Company</h2>
                    <p className="text-gray-400 mt-3 text-lg font-medium">Empowering the Indian Workforce</p>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-700 delay-200">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Login ID / Phone / Email</label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-medium placeholder:text-gray-600"
                                    placeholder="EMP001 or 98..."
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-medium placeholder:text-gray-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-2xl py-4 font-black shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>Sign In</>
                            )}
                        </button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                                <span className="bg-[#111827] px-4 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="pt-4 text-center">
                                <p className="text-gray-400 font-medium">
                                    New employee?{' '}
                                    <Link to="/register" className="text-primary-500 hover:text-primary-400 font-black transition-colors underline underline-offset-4">
                                        Join the fleet
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                <p className="text-center mt-10 text-gray-500 font-medium animate-in fade-in duration-1000 delay-500">
                    Trusted by over <span className="text-white font-bold">1,000+</span> teams worldwide
                </p>
            </div>
        </div>
    );
};

export default Login;
