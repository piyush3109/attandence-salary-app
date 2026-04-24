const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const {
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
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .post(createGroup)
    .get(getGroups);

router.route('/:id')
    .get(getGroupById)
    .put(async (req, res) => {
        try {
            const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(group);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

router.post('/:id/join', requestToJoin);
router.post('/:id/join/review', reviewJoinRequest);
router.post('/:id/report', reportGroup);
router.post('/:id/block', blockMember);
router.post('/:id/admins/assign', assignGroupAdmin);
router.post('/:id/ops-visibility', updateOpsVisibility);

router.route('/:id/members').post(addMember);
router.route('/:id/members/:memberId').delete(removeMember);

router.post('/:id/channels', createChannel);
router.post('/:id/channels/:channelId/join', joinChannel);

router.post('/:id/posts', createPost);
router.post('/:id/posts/:postId/vote', voteOnPoll);

module.exports = router;
