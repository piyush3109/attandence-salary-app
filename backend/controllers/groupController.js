const Group = require('../models/Group');

const userRef = (user) => ({
    id: user._id,
    model: user.role === 'employee' ? 'Employee' : 'Admin',
    role: 'member'
});

const userModel = (user) => user.role === 'employee' ? 'Employee' : 'Admin';
const isOrgAdmin = (user) => ['admin', 'ceo', 'manager'].includes(user.role);

const isGroupAdmin = (group, userId) =>
    group.admin.id.toString() === userId.toString() ||
    group.groupAdmins.some((m) => m.id.toString() === userId.toString()) ||
    group.members.some((m) => m.id.toString() === userId.toString() && m.role === 'admin');

const createGroup = async (req, res) => {
    try {
        const { name, description, members = [] } = req.body;
        const orgId = req.user.orgId || 'default';

        if (!name) return res.status(400).json({ message: 'Group name is required' });

        const creator = {
            id: req.user._id,
            model: userModel(req.user),
            role: 'admin'
        };

        const normalizedMembers = members.map((m) => ({
            id: m.id,
            model: m.model || 'Employee',
            role: m.role || 'member'
        }));

        if (!normalizedMembers.some((m) => m.id.toString() === req.user._id.toString())) {
            normalizedMembers.push(creator);
        }

        const group = await Group.create({
            name,
            description,
            admin: { id: req.user._id, model: userModel(req.user) },
            groupAdmins: [creator],
            members: normalizedMembers,
            channels: [{
                name: 'general',
                description: 'Default announcements and discussions',
                createdBy: { id: req.user._id, model: userModel(req.user) },
                subscribers: normalizedMembers
            }],
            orgId
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGroups = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const groups = await Group.find({ orgId, isActive: true }).sort({ createdAt: -1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addMember = async (req, res) => {
    try {
        const { memberId, model, role } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!isGroupAdmin(group, req.user._id) && !isOrgAdmin(req.user)) {
            return res.status(403).json({ message: 'Only admin can add members' });
        }

        const exists = group.members.find((m) => m.id.toString() === memberId);
        if (exists) return res.status(400).json({ message: 'Member already in group' });

        const member = { id: memberId, model: model || 'Employee', role: role || 'member' };
        group.members.push(member);
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeMember = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!isGroupAdmin(group, req.user._id) && !isOrgAdmin(req.user)) {
            return res.status(403).json({ message: 'Only admin can remove members' });
        }

        group.members = group.members.filter((m) => m.id.toString() !== req.params.memberId);
        group.groupAdmins = group.groupAdmins.filter((m) => m.id.toString() !== req.params.memberId);
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const requestToJoin = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const blocked = group.blockedUsers.some((u) => u.id.toString() === req.user._id.toString());
        if (blocked) return res.status(403).json({ message: 'You are blocked from this group' });

        if (group.members.some((u) => u.id.toString() === req.user._id.toString())) {
            return res.status(400).json({ message: 'You are already a member' });
        }

        if (!group.joinRequests.some((u) => u.id.toString() === req.user._id.toString())) {
            group.joinRequests.push(userRef(req.user));
            await group.save();
        }
        res.json({ message: 'Join request submitted', group });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const reviewJoinRequest = async (req, res) => {
    try {
        const { memberId, action } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!isGroupAdmin(group, req.user._id) && !isOrgAdmin(req.user)) {
            return res.status(403).json({ message: 'Only admin can review join requests' });
        }

        const request = group.joinRequests.find((u) => u.id.toString() === memberId);
        if (!request) return res.status(404).json({ message: 'Join request not found' });

        if (action === 'approve' && !group.members.some((u) => u.id.toString() === memberId)) {
            group.members.push({ ...request.toObject(), role: 'member' });
        }
        group.joinRequests = group.joinRequests.filter((u) => u.id.toString() !== memberId);
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const blockMember = async (req, res) => {
    try {
        const { memberId, model = 'Employee' } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!isGroupAdmin(group, req.user._id) && !isOrgAdmin(req.user)) {
            return res.status(403).json({ message: 'Only admin can block members' });
        }

        group.members = group.members.filter((u) => u.id.toString() !== memberId);
        group.groupAdmins = group.groupAdmins.filter((u) => u.id.toString() !== memberId);
        if (!group.blockedUsers.some((u) => u.id.toString() === memberId)) {
            group.blockedUsers.push({ id: memberId, model, role: 'member' });
        }
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const reportGroup = async (req, res) => {
    try {
        const { reason } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        group.reports.push({ reporter: userRef(req.user), reason: reason || 'No reason provided' });
        await group.save();
        res.json({ message: 'Report submitted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const assignGroupAdmin = async (req, res) => {
    try {
        const { memberId } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!isOrgAdmin(req.user) && group.admin.id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only app admin or owner can assign group admins' });
        }

        const member = group.members.find((m) => m.id.toString() === memberId);
        if (!member) return res.status(404).json({ message: 'Member must join group first' });

        member.role = 'admin';
        if (!group.groupAdmins.some((m) => m.id.toString() === memberId)) {
            group.groupAdmins.push({ id: member.id, model: member.model, role: 'admin' });
        }
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createChannel = async (req, res) => {
    try {
        const { name, description } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!isGroupAdmin(group, req.user._id) && !isOrgAdmin(req.user)) {
            return res.status(403).json({ message: 'Only admin can create channels' });
        }

        if (group.channels.some((c) => c.name.toLowerCase() === String(name || '').toLowerCase())) {
            return res.status(400).json({ message: 'Channel already exists' });
        }

        group.channels.push({
            name,
            description,
            createdBy: { id: req.user._id, model: userModel(req.user) },
            subscribers: group.members
        });
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const joinChannel = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const channel = group.channels.id(req.params.channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        if (!channel.subscribers.some((u) => u.id.toString() === req.user._id.toString())) {
            channel.subscribers.push(userRef(req.user));
            await group.save();
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPost = async (req, res) => {
    try {
        const { type = 'message', content, channelName = 'general', poll, taskMeta, eventMeta } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const member = group.members.find((u) => u.id.toString() === req.user._id.toString());
        if (!member) return res.status(403).json({ message: 'Only group members can post' });

        if (['task', 'reminder', 'event'].includes(type) && !isGroupAdmin(group, req.user._id) && !isOrgAdmin(req.user)) {
            return res.status(403).json({ message: 'Only admins can send task/reminder/event' });
        }

        const post = {
            type,
            content,
            channelName,
            createdBy: {
                id: req.user._id,
                model: userModel(req.user),
                name: req.user.name || req.user.username
            },
            poll,
            taskMeta,
            eventMeta
        };
        group.posts.push(post);
        await group.save();
        res.status(201).json(group.posts[group.posts.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const voteOnPoll = async (req, res) => {
    try {
        const { optionIndexes = [] } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        const post = group.posts.id(req.params.postId);
        if (!post || post.type !== 'poll') return res.status(404).json({ message: 'Poll not found' });

        post.poll.options.forEach((opt) => {
            opt.votes = opt.votes.filter((v) => v.id.toString() !== req.user._id.toString());
        });

        const selected = post.poll.allowMultiple ? optionIndexes : optionIndexes.slice(0, 1);
        selected.forEach((idx) => {
            if (post.poll.options[idx]) {
                post.poll.options[idx].votes.push({ id: req.user._id, model: userModel(req.user) });
            }
        });

        await group.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateOpsVisibility = async (req, res) => {
    try {
        const { roles } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!isOrgAdmin(req.user)) return res.status(403).json({ message: 'Only app admins can update visibility' });

        group.operationsCenterVisibleTo = Array.isArray(roles) && roles.length ? roles : ['admin', 'ceo', 'manager'];
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createGroup,
    getGroups,
    getGroupById,
    addMember,
    removeMember,
    requestToJoin,
    reviewJoinRequest,
    blockMember,
    reportGroup,
    assignGroupAdmin,
    createChannel,
    joinChannel,
    createPost,
    voteOnPoll,
    updateOpsVisibility
};
