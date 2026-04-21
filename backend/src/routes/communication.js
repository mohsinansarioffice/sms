const express = require('express');
const { body } = require('express-validator');
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
  getUnreadCount,
  getAnnouncementReaders,
  getMessages,
  getMessage,
  sendMessage,
  deleteMessage,
  getUnreadMessagesCount,
  getUsers
} = require('../controllers/communicationController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const commGate = checkFeature('communication');

const announcementValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('priority').optional().isIn(['normal', 'important', 'urgent']).withMessage('Invalid priority'),
  body('targetAudience')
    .optional()
    .isIn(['all', 'teachers', 'students', 'parents', 'specific_class'])
    .withMessage('Invalid target audience')
];

router.get('/announcements', protect, commGate, getAnnouncements);
router.get('/announcements/unread/count', protect, commGate, getUnreadCount);
router.get('/announcements/:id/readers', protect, commGate, getAnnouncementReaders);
router.get('/announcements/:id', protect, commGate, getAnnouncement);
router.post('/announcements', protect, commGate, authorize('admin', 'teacher'), announcementValidators, createAnnouncement);
router.put('/announcements/:id', protect, commGate, authorize('admin', 'teacher'), updateAnnouncement);
router.delete('/announcements/:id', protect, commGate, authorize('admin', 'teacher'), deleteAnnouncement);
router.post('/announcements/:id/read', protect, commGate, markAnnouncementRead);

router.get('/messages', protect, commGate, getMessages);
router.get('/messages/unread/count', protect, commGate, getUnreadMessagesCount);
router.get('/messages/:id', protect, commGate, getMessage);
router.post(
  '/messages',
  protect,
  commGate,
  [
    body('recipientId').notEmpty().withMessage('Recipient is required'),
    body('content').trim().notEmpty().withMessage('Content is required')
  ],
  sendMessage
);
router.delete('/messages/:id', protect, commGate, deleteMessage);

router.get('/users', protect, commGate, getUsers);

module.exports = router;
