import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    User,
    Mail,
    Phone,
    Shield,
    Briefcase,
    IndianRupee,
    MapPin,
    AlertCircle,
    Camera,
    Edit3,
    Save,
    X,
    Film,
    Loader2,
    Check,
    Search,
    FileText,
    Trophy,
    Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';

// ─── GIF Profile Picker ────────────────────────────────
const GifProfilePicker = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('avatar');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchGifs = async (q) => {
        setLoading(true);
        try {
            const endpoint = q
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=16&rating=g`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=16&rating=g`;
            const res = await fetch(endpoint);
            const data = await res.json();
            setGifs(data.data || []);
        } catch {
            toast.error('Failed to load GIFs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { searchGifs(query); }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchGifs(query), 500);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-lg dark:text-white">Choose GIF as Profile</h3>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search GIFs for profile..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        />
                    </div>
                </div>
                <div className="p-4 grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="col-span-4 flex justify-center py-10">
                            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                        </div>
                    ) : gifs.map((gif) => (
                        <button
                            key={gif.id}
                            onClick={() => onSelect(gif.images.fixed_height.url)}
                            className="aspect-square rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all bg-gray-100 dark:bg-gray-800"
                        >
                            <img src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                    ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-right">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Powered by GIPHY</span>
                </div>
            </div>
        </div>
    );
};

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);

    const photoInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (user?.role === 'employee') {
                    const { data } = await api.get(`/employees/${user._id}`);
                    setProfile(data);
                } else {
                    setProfile({
                        name: user.username,
                        email: user.email,
                        role: user.role,
                        position: 'System Administrator',
                        isAdmin: true,
                        profilePhoto: user.profilePhoto
                    });
                }
            } catch (error) {
                toast.error('Failed to load profile details');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const startEditing = () => {
        setEditData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            guarantorName: profile.guarantor?.name || '',
            guarantorPhone: profile.guarantor?.phone || '',
            guarantorRelation: profile.guarantor?.relation || ''
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditData({});
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const updatePayload = {
                name: editData.name,
                email: editData.email,
                phone: editData.phone,
                address: editData.address,
                guarantor: {
                    name: editData.guarantorName,
                    phone: editData.guarantorPhone,
                    relation: editData.guarantorRelation
                }
            };

            await api.put(`/employees/${user._id}`, updatePayload);

            // Refresh profile
            const { data } = await api.get(`/employees/${user._id}`);
            setProfile(data);

            // Update user cookie with new name/email
            const userInfo = JSON.parse(Cookies.get('userInfo') || '{}');
            userInfo.username = editData.name;
            userInfo.email = editData.email;
            Cookies.set('userInfo', JSON.stringify(userInfo), { expires: 30 });

            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);

            const { data } = await api.post('/messages/profile-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const photoUrl = data.profilePhoto;
            setProfile(prev => ({ ...prev, profilePhoto: photoUrl }));

            // Update cookie
            const userInfo = JSON.parse(Cookies.get('userInfo') || '{}');
            userInfo.profilePhoto = photoUrl;
            Cookies.set('userInfo', JSON.stringify(userInfo), { expires: 30 });

            toast.success('Profile photo updated!');
        } catch (error) {
            toast.error('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleGifProfileSelect = async (gifUrl) => {
        setShowGifPicker(false);
        setUploadingPhoto(true);
        try {
            const { data } = await api.post('/messages/profile-photo', { gifUrl });

            setProfile(prev => ({ ...prev, profilePhoto: gifUrl }));

            // Update cookie
            const userInfo = JSON.parse(Cookies.get('userInfo') || '{}');
            userInfo.profilePhoto = gifUrl;
            Cookies.set('userInfo', JSON.stringify(userInfo), { expires: 30 });

            toast.success('GIF profile set!');
        } catch (error) {
            toast.error('Failed to set GIF profile');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docType, setDocType] = useState('Aadhar');
    const docInputRef = useRef(null);

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingDoc(true);
        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('type', docType);
            formData.append('title', file.name);

            const { data } = await api.post(`/employees/${user._id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Refresh profile to get the new document
            const res = await api.get(`/employees/${user._id}`);
            setProfile(res.data);

            toast.success('Document uploaded successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploadingDoc(false);
            if (docInputRef.current) docInputRef.current.value = '';
        }
    };

    const getPhotoSrc = () => {
        const photo = profile?.profilePhoto;
        if (!photo) return null;
        if (photo.startsWith('http')) return photo;
        return `${API_BASE}${photo}`;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
    );

    if (!profile) return (
        <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Profile Not Found</h2>
            <p className="text-gray-500 mt-2">We couldn't retrieve your profile data.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 px-2 md:px-0">
            {/* GIF Picker Modal */}
            {showGifPicker && (
                <GifProfilePicker onSelect={handleGifProfileSelect} onClose={() => setShowGifPicker(false)} />
            )}

            {/* Profile Header */}
            <div className="relative h-36 md:h-48 rounded-2xl md:rounded-[2.5rem] bg-gradient-to-r from-primary-600 to-indigo-600 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                <div className="absolute -bottom-12 md:-bottom-12 left-4 md:left-10 flex items-end gap-4 md:gap-6">
                    {/* Profile Photo */}
                    <div className="relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-white dark:bg-gray-800 p-1.5 md:p-2 shadow-2xl">
                            <div className="w-full h-full rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
                                {getPhotoSrc() ? (
                                    <img src={getPhotoSrc()} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl md:text-4xl font-black text-primary-600">
                                        {profile.name?.charAt(0)}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Photo upload overlay */}
                        <div className="absolute inset-1.5 md:inset-2 rounded-xl md:rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer">
                            <input
                                type="file"
                                ref={photoInputRef}
                                onChange={handlePhotoUpload}
                                className="hidden"
                                accept="image/*"
                            />
                            {uploadingPhoto ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <>
                                    <button
                                        onClick={() => photoInputRef.current?.click()}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                                        title="Upload photo"
                                    >
                                        <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => setShowGifPicker(true)}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                                        title="Use GIF"
                                    >
                                        <Film className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="mb-10 md:mb-14">
                        <h1 className="text-xl md:text-3xl font-black text-white tracking-tight">{profile.name}</h1>
                        <p className="text-primary-100 font-bold uppercase text-[10px] md:text-xs tracking-widest mt-1 flex items-center gap-2">
                            <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {profile.role || 'Member'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pt-10 md:pt-6">
                <div className="md:col-span-2 space-y-4 md:space-y-8">
                    {/* Achievements & Rewards */}
                    {!profile.isAdmin && (
                        <div className="card p-6 bg-gradient-to-br from-indigo-600 to-indigo-900 border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Trophy className="w-32 h-32 text-white" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-amber-300" /> Achievements
                                    </h3>
                                    <p className="text-indigo-100 text-xs font-medium">Keep it up! Your punctuality score is in the top 10%.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Points</p>
                                        <p className="text-2xl font-black">{profile.gamification?.points || 0}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Streak</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                                            <p className="text-2xl font-black">{profile.gamification?.attendanceStreak || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3 relative z-10">
                                {profile.gamification?.badges?.map((badge, idx) => (
                                    <div key={idx} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-xl flex items-center gap-2 border border-white/5">
                                        <span className="text-lg">{badge.icon || '🏅'}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{badge.name}</span>
                                    </div>
                                )) || (
                                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">No badges unlocked yet. Start your streak today!</p>
                                    )}
                            </div>
                        </div>
                    )}

                    <div className="card p-5 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg md:text-xl font-black dark:text-white flex items-center gap-3">
                                <User className="w-5 h-5 text-primary-500" />
                                Personal Information
                            </h3>
                            {!profile.isAdmin && (
                                <div>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={cancelEditing}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" /> Cancel
                                            </button>
                                            <button
                                                onClick={saveProfile}
                                                disabled={saving}
                                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={startEditing}
                                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all border border-primary-200 dark:border-primary-800"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8">
                            {/* Email */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editData.email}
                                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-bold dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {profile.email || 'N/A'}
                                    </div>
                                )}
                            </div>
                            {/* Phone */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editData.phone}
                                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-bold dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {profile.phone || 'N/A'}
                                    </div>
                                )}
                            </div>
                            {/* Position - Read only, set by admin */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Position</p>
                                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    {profile.position}
                                    {!profile.isAdmin && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full uppercase">Set by Admin</span>
                                    )}
                                </div>
                            </div>
                            {/* Address */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Permanent Address</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.address}
                                        onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-bold dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                ) : (
                                    <div className="flex items-start gap-2 text-gray-900 dark:text-white font-bold max-w-xs text-sm">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        {profile.address || 'Not Provided'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guarantor Information */}
                        {!profile.isAdmin && (
                            <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg md:text-xl font-black mb-6 dark:text-white flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-amber-500" />
                                    Guarantor Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8 bg-gray-50 dark:bg-gray-800/20 p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guarantor Name</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editData.guarantorName}
                                                onChange={(e) => setEditData(prev => ({ ...prev, guarantorName: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        ) : (
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{profile.guarantor?.name || 'N/A'}</div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Relation</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editData.guarantorRelation}
                                                onChange={(e) => setEditData(prev => ({ ...prev, guarantorRelation: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        ) : (
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{profile.guarantor?.relation || 'N/A'}</div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guarantor Phone</p>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editData.guarantorPhone}
                                                onChange={(e) => setEditData(prev => ({ ...prev, guarantorPhone: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        ) : (
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{profile.guarantor?.phone || 'N/A'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4 md:space-y-8">
                    <div className="card p-5 md:p-8 bg-gray-50 dark:bg-gray-800/30 border-none shadow-none">
                        <h3 className="text-lg md:text-xl font-black mb-6 dark:text-white flex items-center gap-3">
                            <IndianRupee className="w-5 h-5 text-emerald-500" />
                            Salary Details
                        </h3>
                        {!profile.isAdmin ? (
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-sm">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Rate</span>
                                    <span className="text-base md:text-lg font-black text-emerald-600">₹{profile.salaryRate?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-sm">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Type</span>
                                    <span className="text-xs font-black uppercase text-gray-900 dark:text-white">
                                        {profile.rateType?.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="p-4 md:p-5 bg-amber-500/10 rounded-[1.2rem] md:rounded-[1.5rem] border border-amber-500/20">
                                    <p className="text-[10px] font-black text-amber-600 uppercase mb-1 tracking-widest">Note</p>
                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Salary rate is managed by Admin / CEO / Manager</p>
                                </div>
                                <div className="p-4 md:p-5 bg-emerald-500/10 rounded-[1.2rem] md:rounded-[1.5rem] border border-emerald-500/20">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">System Status</p>
                                    <p className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5" /> VERIFIED & ACTIVE
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 md:p-10 text-center">
                                <Shield className="w-12 h-12 text-primary-500/20 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Admin Authority</p>
                            </div>
                        )}
                    </div>

                    {/* Document Management / KYC */}
                    {!profile.isAdmin && (
                        <div className="card p-5 md:p-8 bg-white dark:bg-gray-800 border shadow-sm">
                            <h3 className="text-lg font-black mb-6 dark:text-white flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-500" />
                                KYC Documents
                            </h3>

                            <div className="space-y-4">
                                {/* Upload UI */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={docType}
                                            onChange={(e) => setDocType(e.target.value)}
                                            className="input py-2 text-xs font-bold w-full bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="Aadhar">Aadhar Card</option>
                                            <option value="PAN">PAN Card</option>
                                            <option value="Certificate">Certificate</option>
                                            <option value="Resume">Resume</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <input
                                        type="file"
                                        ref={docInputRef}
                                        onChange={handleDocumentUpload}
                                        className="hidden"
                                        accept=".pdf,image/*"
                                    />
                                    <button
                                        onClick={() => docInputRef.current?.click()}
                                        disabled={uploadingDoc}
                                        className="w-full btn bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white border-none py-2 text-xs h-auto shadow-none"
                                    >
                                        {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Upload Document'}
                                    </button>
                                </div>

                                {/* List Documents */}
                                {profile.documents && profile.documents.length > 0 ? (
                                    <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
                                        {profile.documents.map((doc, idx) => (
                                            <a
                                                key={idx}
                                                href={`${API_BASE}${doc.url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800 group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors uppercase">{doc.category || doc.type}</p>
                                                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{doc.title}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No documents uploaded yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
