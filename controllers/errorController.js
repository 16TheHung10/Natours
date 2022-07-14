const AppError = require('./../utils/appError');
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  // const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const keys = Object.keys(err.keyValue);
  let value = err.keyValue.keys[0];

  const message = `Duplicate field value in database: ${value}. Please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data111111. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = (er) => {
  return new AppError('Invalid token. Please log in again!', 401);
};
const handleJWTExpired = () => {
  return new AppError('Your time login is run out. Please log in again!', 401);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  //Những lỗi đã được xác định và định nghĩa, nếu lỗi đó chưa được định nghĩa thì trả về code 500
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};
globalErrorHandler = (err, req, res, next) => {
  //console.log(err.stack); //show us where the error happened
  //Không set status 404,400... cho thg err được mà phải set ở các middleware khác vì đâu biết nó code bao nhiêu đâu mà set
  // và khi có lỗi sẽ nhảy sang thg này và chạy tiếp
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error'; //error is status for code 500

  // chia ra 2 thg : 1 là khi dev ta cần nhiều thông tin hơn để debug
  //2 là khi deploy thì chỉ cần status vs message là đủ
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //Việc ở trong block code này là cố gắng tạo ra một message lỗi có nghĩa cho user
    //Ví dụ khi có lỗi trong quá trình sử dụng nó sẽ tự thêm 'CastError' trước message
    //Nên phải tạo ra message mới có ý nghĩa hơn, tường minh hơn cho user
    let error = { ...err }; //Not good to override err function so just copy that
    //CastError như là lỗi trong quá trình sử dụng, hoạt động của project(operation)
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpired(error);
    sendErrorProd(error, res);
  }
};
module.exports = globalErrorHandler;
