import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    Plus,
    Shield,
    Megaphone,
    Send,
    UserCheck,
    UserX,
    Flag,
    Vote,
    Bell,
    CalendarDays
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const defaultPoll = {
    question: '',
    options: ['', ''],
    allowMultiple: false,
    hasCorrectAnswer: false,
    correctIndexes: []
};

const Groups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeGroupId, setActiveGroupId] = useState('');

    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    const [channelName, setChannelName] = useState('');
    const [postType, setPostType] = useState('message');
    const [postContent, setPostContent] = useState('');
    const [poll, setPoll] = useState(defaultPoll);
    const [selectedChannel, setSelectedChannel] = useState('general');

    const isAppAdmin = ['admin', 'ceo', 'manager'].includes(user?.role);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [grpRes, empRes] = await Promise.all([api.get('/groups'), api.get('/employees')]);
            setGroups(grpRes.data || []);
            setEmployees(empRes.data || []);
            if (!activeGroupId && grpRes.data?.length) {
                setActiveGroupId(grpRes.data[0]._id);
            }
        } catch (error) {
            toast.error('Failed to load group data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const activeGroup = useMemo(
        () => groups.find((g) => g._id === activeGroupId) || groups[0],
        [groups, activeGroupId]
    );

    const isCurrentUserGroupAdmin = useMemo(() => {
        if (!activeGroup || !user?._id) return false;
        const owner = activeGroup.admin?.id === user._id;
        const listed = activeGroup.groupAdmins?.some((a) => a.id === user._id) ||
            activeGroup.members?.some((m) => m.id === user._id && m.role === 'admin');
        return owner || listed || isAppAdmin;
    }, [activeGroup, user?._id, isAppAdmin]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const members = selectedMembers.map((id) => ({ id, model: 'Employee', role: 'member' }));
            await api.post('/groups', { name: newGroupName, description: newGroupDesc, members });
            toast.success('Group created');
            setNewGroupName('');
            setNewGroupDesc('');
            setSelectedMembers([]);
            fetchData();
        } catch {
            toast.error('Failed to create group');
        }
    };

    const callAction = async (url, payload, okMsg) => {
        try {
            await api.post(url, payload);
            toast.success(okMsg);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    const submitPost = async (e) => {
        e.preventDefault();
        if (!activeGroup?._id) return;
        try {
            const payload = { type: postType, content: postContent, channelName: selectedChannel };
            if (postType === 'poll') {
                payload.poll = {
                    question: poll.question,
                    options: poll.options.filter(Boolean).map((text, idx) => ({
                        text,
                        isCorrect: poll.hasCorrectAnswer ? poll.correctIndexes.includes(idx) : false
                    })),
                    allowMultiple: poll.allowMultiple,
                    hasCorrectAnswer: poll.hasCorrectAnswer
                };
            }
            await api.post(`/groups/${activeGroup._id}/posts`, payload);
            toast.success('Post sent');
            setPostContent('');
            setPoll(defaultPoll);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send');
        }
    };

    const votePoll = async (postId, optionIndexes) => {
        if (!activeGroup?._id) return;
        await callAction(`/groups/${activeGroup._id}/posts/${postId}/vote`, { optionIndexes }, 'Vote submitted');
    };

    return (
        <div className="space-y-6 p-4 md:p-8">
            <div>
                <h1 className="text-3xl font-black dark:text-white">Groups & Channels</h1>
                <p className="text-gray-500">Group admin, join/block/report, channel, poll, task/reminder/event enabled.</p>
            </div>

            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card p-4 space-y-4">
                        <h3 className="font-black">Create Group</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-3">
                            <input className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800" placeholder="Group name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required />
                            <textarea className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800" placeholder="Description" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                            <div className="max-h-40 overflow-auto space-y-2">
                                {employees.map((e) => (
                                    <label key={e._id} className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={selectedMembers.includes(e._id)} onChange={() => setSelectedMembers((prev) => prev.includes(e._id) ? prev.filter((x) => x !== e._id) : [...prev, e._id])} />
                                        {e.name}
                                    </label>
                                ))}
                            </div>
                            <button className="btn btn-primary w-full"><Plus className="w-4 h-4" />Create</button>
                        </form>

                        <div className="pt-4 border-t dark:border-gray-700">
                            <h4 className="font-black mb-2">All Groups</h4>
                            <div className="space-y-2">
                                {groups.map((g) => (
                                    <button key={g._id} onClick={() => setActiveGroupId(g._id)} className={`w-full text-left p-3 rounded-xl ${activeGroup?._id === g._id ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <div className="font-bold">{g.name}</div>
                                        <div className="text-xs text-gray-500">{g.members?.length || 0} members</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 card p-4 space-y-4">
                        {activeGroup ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black dark:text-white">{activeGroup.name}</h2>
                                        <p className="text-sm text-gray-500">Group admins: {activeGroup.groupAdmins?.length || 0}</p>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <button className="btn btn-secondary" onClick={() => callAction(`/groups/${activeGroup._id}/join`, {}, 'Join requested')}><UserCheck className="w-4 h-4" />Join</button>
                                        <button className="btn btn-secondary" onClick={() => callAction(`/groups/${activeGroup._id}/report`, { reason: 'Reported by user' }, 'Reported')}><Flag className="w-4 h-4" />Report</button>
                                        {isCurrentUserGroupAdmin && (
                                            <button className="btn btn-secondary" onClick={() => callAction(`/groups/${activeGroup._id}/block`, { memberId: activeGroup.members?.[0]?.id, model: 'Employee' }, 'User blocked')}><UserX className="w-4 h-4" />Block</button>
                                        )}
                                    </div>
                                </div>

                                {isCurrentUserGroupAdmin && (
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <button className="btn btn-secondary" onClick={() => callAction(`/groups/${activeGroup._id}/admins/assign`, { memberId: activeGroup.members?.find((m) => m.role !== 'admin')?.id }, 'Assigned as group admin')}><Shield className="w-4 h-4" />Assign Group Admin</button>
                                        {isAppAdmin && <button className="btn btn-secondary" onClick={() => callAction(`/groups/${activeGroup._id}/ops-visibility`, { roles: ['admin', 'ceo', 'manager'] }, 'Operations center visibility updated')}><Megaphone className="w-4 h-4" />Ops by Admin only</button>}
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-3">
                                    <input className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800" placeholder="Create channel" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                                    <button className="btn btn-secondary" onClick={() => callAction(`/groups/${activeGroup._id}/channels`, { name: channelName, description: 'News updates channel' }, 'Channel created')}>Add Channel</button>
                                </div>

                                <form onSubmit={submitPost} className="space-y-3 border-t pt-4 dark:border-gray-700">
                                    <div className="grid md:grid-cols-3 gap-3">
                                        <select className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800" value={postType} onChange={(e) => setPostType(e.target.value)}>
                                            <option value="message">Message</option>
                                            <option value="task">Task</option>
                                            <option value="reminder">Reminder</option>
                                            <option value="event">Event</option>
                                            <option value="poll">Poll</option>
                                        </select>
                                        <select className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800" value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}>
                                            {(activeGroup.channels || []).map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <button className="btn btn-primary" type="submit"><Send className="w-4 h-4" />Send</button>
                                    </div>
                                    <textarea className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800" value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Write message/task/reminder/event" />

                                    {postType === 'poll' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/30">
                                            <input className="w-full p-2 rounded-lg bg-white dark:bg-gray-800" placeholder="Poll question" value={poll.question} onChange={(e) => setPoll({ ...poll, question: e.target.value })} />
                                            {poll.options.map((opt, i) => (
                                                <input key={i} className="w-full p-2 rounded-lg bg-white dark:bg-gray-800" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => {
                                                    const next = [...poll.options]; next[i] = e.target.value; setPoll({ ...poll, options: next });
                                                }} />
                                            ))}
                                            <button type="button" className="btn btn-secondary" onClick={() => setPoll({ ...poll, options: [...poll.options, ''] })}>+ option</button>
                                            <div className="flex gap-4 text-sm">
                                                <label><input type="checkbox" checked={poll.allowMultiple} onChange={(e) => setPoll({ ...poll, allowMultiple: e.target.checked })} /> Multiple option</label>
                                                <label><input type="checkbox" checked={poll.hasCorrectAnswer} onChange={(e) => setPoll({ ...poll, hasCorrectAnswer: e.target.checked })} /> Has correct answer</label>
                                            </div>
                                        </motion.div>
                                    )}
                                </form>

                                <div className="space-y-2">
                                    {(activeGroup.posts || []).slice().reverse().map((post) => (
                                        <div key={post._id} className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                                            <div className="text-xs text-gray-500">#{post.channelName} • {post.type}</div>
                                            <div className="font-semibold dark:text-white">{post.content || post.poll?.question}</div>
                                            {post.type === 'poll' && (
                                                <div className="mt-2 space-y-1">
                                                    {post.poll?.options?.map((op, idx) => (
                                                        <button key={idx} className="w-full text-left px-2 py-1 rounded bg-white/80 dark:bg-gray-700" onClick={() => votePoll(post._id, [idx])}>
                                                            <Vote className="w-3 h-3 inline mr-1" />{op.text} ({op.votes?.length || 0})
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {post.type === 'task' && <span className="text-xs text-blue-600"><UserCheck className="w-3 h-3 inline" /> Admin task</span>}
                                            {post.type === 'reminder' && <span className="text-xs text-amber-600"><Bell className="w-3 h-3 inline" /> Reminder</span>}
                                            {post.type === 'event' && <span className="text-xs text-emerald-600"><CalendarDays className="w-3 h-3 inline" /> Event</span>}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <p>No groups yet.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
