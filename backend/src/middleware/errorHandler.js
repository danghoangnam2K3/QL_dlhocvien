const errorHandler = (err, req, res, next) => {
  console.error('[ErrorHandler]', err);

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File quá lớn. Giới hạn 10MB.' });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi hệ thống. Vui lòng thử lại sau.';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
