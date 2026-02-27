import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    User,
    Mail,
    Phone,
    Lock,
    MapPin,
    Briefcase,
    ArrowRight,
    Loader2
} from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        position: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.password) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await register(formData);
            if (result.success) {
                toast.success('🎉 Registration successful! Welcome aboard!');
                navigate('/');
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 md:p-6 selection:bg-primary-500/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-xl relative">
                <div className="bg-white/5 backdrop-blur-2xl p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] border border-white/10 shadow-2xl space-y-8 md:space-y-10">

                    <div className="text-center space-y-3 md:space-y-4">
                        <div className="inline-flex p-4 md:p-5 rounded-2xl md:rounded-3xl bg-primary-500/10 border border-primary-500/20 mb-2 md:mb-4 group hover:scale-110 transition-transform duration-500">
                            <User className="w-8 h-8 md:w-10 md:h-10 text-primary-500" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">Create Account</h2>
                        <p className="text-gray-400 text-sm md:text-lg font-medium">Register to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Full Name *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl md:rounded-[2rem] py-3 md:py-4 pl-12 md:pl-14 pr-4 md:pr-6 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base md:text-lg font-medium placeholder:text-gray-600"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl md:rounded-[2rem] py-3 md:py-4 pl-12 md:pl-14 pr-4 md:pr-6 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base md:text-lg font-medium placeholder:text-gray-600"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Phone Number *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl md:rounded-[2rem] py-3 md:py-4 pl-12 md:pl-14 pr-4 md:pr-6 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base md:text-lg font-medium placeholder:text-gray-600"
                                        placeholder="9876543210"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Password *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl md:rounded-[2rem] py-3 md:py-4 pl-12 md:pl-14 pr-4 md:pr-6 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base md:text-lg font-medium placeholder:text-gray-600"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Position */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Position</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                                        <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl md:rounded-[2rem] py-3 md:py-4 pl-12 md:pl-14 pr-4 md:pr-6 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base md:text-lg font-medium placeholder:text-gray-600"
                                        placeholder="Employee"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none">
                                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl md:rounded-[2rem] py-3 md:py-4 pl-12 md:pl-14 pr-4 md:pr-6 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base md:text-lg font-medium placeholder:text-gray-600"
                                        placeholder="City, State"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-4 md:py-5 rounded-xl md:rounded-[2rem] shadow-xl shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-4 md:pt-6 text-center">
                        <p className="text-gray-500 font-medium text-sm md:text-base">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-500 hover:text-primary-400 font-black transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
