import React, { useState } from 'react';
import {
    Github,
    Linkedin,
    Mail,
    Phone,
    Code2,
    Heart,
    Award,
    ExternalLink,
    MapPin,
    GraduationCap,
    Bug,
    Send,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';

const DeveloperCard = ({ name, role, bio, location, email, phone, github, linkedin, skills, education }) => (
    <div className="card p-6 md:p-8 space-y-6 group hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

        <div className="space-y-4 relative z-10">
            <div className="flex items-start justify-between">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-primary-500 to-primary-700 p-0.5 shadow-xl shadow-primary-500/20 group-hover:rotate-6 transition-transform">
                    <div className="w-full h-full rounded-[1.4rem] md:rounded-[1.9rem] bg-white dark:bg-gray-900 flex items-center justify-center">
                        <span className="text-2xl md:text-3xl font-black text-primary-600 font-serif">{name.charAt(0)}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a href={github} target="_blank" rel="noopener noreferrer" className="p-2.5 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl md:rounded-2xl hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all" title="GitHub">
                        <Github className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl md:rounded-2xl hover:bg-blue-600 hover:text-white transition-all" title="LinkedIn">
                        <Linkedin className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                    <a href={`mailto:${email}`} className="p-2.5 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl md:rounded-2xl hover:bg-red-500 hover:text-white transition-all" title="Email">
                        <Mail className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                </div>
            </div>

            <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{name}</h3>
                <p className="text-primary-600 dark:text-primary-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">{role}</p>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed italic">
                "{bio}"
            </p>

            <div className="grid grid-cols-1 gap-2 md:gap-3 pt-4">
                <div className="flex items-center gap-3 text-[11px] md:text-xs font-bold text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />
                    {location}
                </div>
                <div className="flex items-center gap-3 text-[11px] md:text-xs font-bold text-gray-600 dark:text-gray-400">
                    <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />
                    <a href={`mailto:${email}`} className="hover:text-primary-500 transition-colors truncate">{email}</a>
                </div>
                <div className="flex items-center gap-3 text-[11px] md:text-xs font-bold text-gray-600 dark:text-gray-400">
                    <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />
                    {education}
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {skills.map((skill, i) => (
                        <span key={i} className="px-2.5 md:px-3 py-1 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-800 group-hover:border-primary-500/30 transition-colors">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ─── Bug Report Section ─────────────────────────────────
const BugReportSection = () => {
    const [bugData, setBugData] = useState({ subject: '', description: '', email: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!bugData.subject || !bugData.description) {
            toast.error('Please describe the bug');
            return;
        }
        setSending(true);
        try {
            // Send bug report via mailto link
            const mailtoLink = `mailto:kk3163019@gmail.com?subject=${encodeURIComponent(`[Bug Report] ${bugData.subject}`)}&body=${encodeURIComponent(`Bug Description:\n${bugData.description}\n\nReporter Email: ${bugData.email || 'Not provided'}\n\nReported at: ${new Date().toLocaleString()}`)}`;
            window.location.href = mailtoLink;
            setSent(true);
            toast.success('Bug report email ready!');
            setTimeout(() => setSent(false), 5000);
            setBugData({ subject: '', description: '', email: '' });
        } catch {
            toast.error('Failed to prepare bug report');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="card p-6 md:p-10 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-500/10 rounded-2xl">
                    <Bug className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">Report a Bug</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Send to kk3163019@gmail.com</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Login page crash"
                            value={bugData.subject}
                            onChange={(e) => setBugData(prev => ({ ...prev, subject: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Email</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={bugData.email}
                            onChange={(e) => setBugData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description *</label>
                    <textarea
                        required
                        rows={3}
                        placeholder="Describe the bug in detail - what happened, what you expected, and steps to reproduce..."
                        value={bugData.description}
                        onChange={(e) => setBugData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                    {sent ? (
                        <><CheckCircle2 className="w-4 h-4" /> Sent!</>
                    ) : sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <><Send className="w-4 h-4" /> Report Bug</>
                    )}
                </button>
            </form>
        </div>
    );
};

const Developers = () => {
    const devs = [
        {
            name: "Krishna Kumar",
            role: "Software Developer & Problem Solver",
            bio: "Passionate about building scalable web platforms and solving complex DSA problems. Open source contributor and tech enthusiast.",
            location: "Lucknow, Uttar Pradesh, India",
            email: "kk3163019@gmail.com",
            phone: "+91 8210763241",
            github: "https://github.com/krishna3163",
            linkedin: "https://www.linkedin.com/in/krishna0858/",
            education: "B.Tech in CSE (AKTU, 2023-2027)",
            skills: ["React", "Node.js", "Express", "MongoDB", "Java", "Python", "SQL"],
        },
        {
            name: "Piyush Tiwari",
            role: "Intern Product Engineer",
            bio: "Enthusiastic developer focused on modern product engineering, API testing, and creating seamless user experiences.",
            location: "Lucknow, Uttar Pradesh, India",
            email: "tiwariansh626@gmail.com",
            phone: "8400975256",
            github: "https://github.com/piyush3109",
            linkedin: "https://www.linkedin.com/in/piyush-tiwari-654aaa341",
            education: "B.Tech in CSE (AIMT, 3rd Year)",
            skills: ["JavaScript", "React", "Node.js", "API Testing", "Git", "DevOps"],
        }
    ];

    return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 px-2 md:px-0">
            <div className="text-center space-y-3 md:space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    <Code2 className="w-4 h-4" />
                    Engineering Team
                </div>
                <h1 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">The Minds Behind The Engine</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-lg">
                    Crafting efficient solutions for modern logistics and workforce management.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {devs.map((dev, index) => (
                    <DeveloperCard key={index} {...dev} />
                ))}
            </div>

            {/* Bug Report Section */}
            <BugReportSection />

            {/* Connect With Us */}
            <div className="card p-8 md:p-12 bg-gradient-to-br from-primary-600 to-indigo-800 text-white border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full -mr-32 md:-mr-48 -mt-32 md:-mt-48 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="space-y-3 md:space-y-4 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Built with passion in India ❤️</h2>
                        <p className="text-primary-100 font-medium text-sm md:text-lg opacity-80">
                            Dedicated to empowering the Indian workforce through smart digital transformation.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <a href="https://www.linkedin.com/in/krishna0858/" target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all backdrop-blur-sm border border-white/10">
                                <Linkedin className="w-4 h-4" /> Connect on LinkedIn
                            </a>
                            <a href="mailto:kk3163019@gmail.com"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all backdrop-blur-sm border border-white/10">
                                <Mail className="w-4 h-4" /> Contact Us
                            </a>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-4 md:p-6 bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl text-center border border-white/10">
                            <span className="block text-2xl md:text-3xl font-black">2025</span>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Version Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Developers;
