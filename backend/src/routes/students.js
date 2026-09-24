const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getStudents, getStudentById, createStudent, importStudents,
  updateStudent, cancelStudent, updateCabin
} = require('../controllers/studentController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/xml', 'application/xml'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|xml)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc XML'), false);
    }
  }
});

router.use(authMiddleware);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.post('/import', upload.single('file'), importStudents);
router.put('/:id', updateStudent);
router.patch('/:id/cancel', cancelStudent);
router.patch('/:id/cabin', updateCabin);

module.exports = router;
