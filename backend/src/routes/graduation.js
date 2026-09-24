const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getBatches, createBatch, getBatchById,
  registerStudents, reviewBatch, exportBatch
} = require('../controllers/graduationController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.get('/batches/:id', getBatchById);
router.post('/batches/:id/register', upload.single('file'), registerStudents);
router.post('/batches/:id/review', reviewBatch);
router.get('/batches/:id/export', exportBatch);

module.exports = router;
