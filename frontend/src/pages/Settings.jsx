import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, Loader2, KeyRound, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { auth as firebaseAuth } from '../firebase';
import { updatePassword } from 'firebase/auth';

const Settings = () => {
    const { user } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const firebaseUser = firebaseAuth.currentUser;
            if (firebaseUser) {
                await updatePassword(firebaseUser, newPassword);
                toast.success('Password updated successfully');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error('Session expired. Please log in again.');
            }
        } catch (error) {
            console.error('Password Update Error:', error);
            if (error.code === 'auth/requires-recent-login') {
                toast.error('Please log in again before changing your password.');
            } else {
                toast.error('Failed to update password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Account Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your security and preferences.</p>
            </div>

            <div className="card p-10 space-y-8">
                <div className="flex items-center gap-4 p-6 bg-primary-50 dark:bg-primary-900/10 rounded-3xl border border-primary-100 dark:border-primary-900/20">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 dark:text-white">Security & Password</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Update your Firebase authentication credentials.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary-500" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                            <p className="text-sm font-bold dark:text-white">{user?.email}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <KeyRound className="w-5 h-5 text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Role</p>
                            <p className="text-sm font-bold dark:text-white uppercase">{user?.role}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                        <label className="label">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                className="input pl-12 h-14"
                                placeholder="Min. 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="label">Confirm New Password</label>
                        <div className="relative">
                            <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                className="input pl-12 h-14"
                                placeholder="Retype password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full h-14"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>Update Secure Password</>
                            )}
                        </button>
                    </div>
                </form>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-center text-gray-400 font-bold uppercase tracking-widest leading-loose">
                        Only you can manage your credentials.
                        <br />We use industry standard encryption protocols.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
