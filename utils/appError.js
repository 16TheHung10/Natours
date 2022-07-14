class AppError extends Error {
  constructor(message, statusCode) {
    //message is the only parameter that the built-in error accepts
    // super(message);
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // is error come from operation ? like database...
    //Error.captureStackTrace like error.stack tell us where the error happened
    // Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
