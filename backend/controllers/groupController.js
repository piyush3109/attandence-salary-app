const Group = require('../models/Group');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
    try {
        const { name, description, members } = req.body;
        const orgId = req.user.orgId || 'default';

        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const group = await Group.create({
            name,
            description,
            admin: {
                id: req.user._id,
                model: req.user.role === 'employee' ? 'Employee' : 'Admin'
            },
            members: members || [],
            orgId
        });

        // Add creator as an admin member if not already present
        const isCreatorInMembers = group.members.some(m => m.id.toString() === req.user._id.toString());
        if (!isCreatorInMembers) {
            group.members.push({
                id: req.user._id,
                model: req.user.role === 'employee' ? 'Employee' : 'Admin',
                role: 'admin'
            });
            await group.save();
        }

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all groups for the organization
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const groups = await Group.find({ orgId, isActive: true })
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single group details
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
const addMember = async (req, res) => {
    try {
        const { memberId, model, role } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if member already exists
        const exists = group.members.find(m => m.id.toString() === memberId);
        if (exists) return res.status(400).json({ message: 'Member already in group' });

        group.members.push({
            id: memberId,
            model: model || 'Employee',
            role: role || 'member'
        });

        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        group.members = group.members.filter(m => m.id.toString() !== req.params.memberId);
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
    removeMember
};
