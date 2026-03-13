const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const {
    createGroup,
    getGroups,
    getGroupById,
    addMember,
    removeMember
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All group routes are protected

router.route('/')
    .post(createGroup)
    .get(getGroups);

router.route('/:id')
    .get(getGroupById)
    .put(protect, async (req, res) => {
        try {
            const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(group);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

router.route('/:id/members')
    .post(addMember);

router.route('/:id/members/:memberId')
    .delete(removeMember);

module.exports = router;
