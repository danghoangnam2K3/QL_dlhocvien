const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getDATProgress, getStudentDAT, importDAT } = require('../controllers/datController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', getDATProgress);
router.get('/student/:studentId', getStudentDAT);
router.post('/import', upload.single('file'), importDAT);

module.exports = router;
