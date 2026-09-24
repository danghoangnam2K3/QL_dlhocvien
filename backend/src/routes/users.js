const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getUsers, createUser, updateUser, toggleLockUser, resetPassword } = require('../controllers/userController');

router.use(authMiddleware, adminOnly);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/lock', toggleLockUser);
router.patch('/:id/reset-password', resetPassword);

module.exports = router;
