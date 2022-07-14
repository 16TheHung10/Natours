const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const signToken = (id) => {
  //Tao token
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;
  // const newUser = await User.create(req.body); //thg nay la 1 promise nen phai await
  const newUser = await User.create({
    //Chỉ lấy thông tin cần thiết. ví dụ user gửi cả role gửi image... thì code như line trên
    //sẽ tạo hết tất cả các fields.(ai muốn đăng ký admin cũng đc nên ko tốt)
    name,
    email,
    password,
    passwordConfirm,
    role,
  });
  const token = signToken(newUser._id);
  //secret is secret. make it unique

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check id email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email nad password!', 400));
  }
  // 2) check if user exists && password is correct
  //+password là bởi vì fields này không được hiện thị (ta đã select:false ở userSchema)
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password);
  //Không để correct tại vì nếu không có user rồi thì fail luôn (dùng || mà) nên đỡ phải await thêm thg corect
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  const userData = await User.findOne({ email });

  console.log(user);
  // 3) if everything ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: userData,
    },
  });
});
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's exist

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please login in to get access', 401)
    );
  }
  // 2) Verification token
  //promisify: CHuyển từ function chứa callback sang 1 promise
  //Như function decode bên dưới. jwt.verify có tham số thứu 3 là 1 callback
  //nên sử dụng promisify sẽ chuyển jwt.verify thành 1 promise và ta cần await nó
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  // Check if delete user but token still there
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exist')
    );
  }

  // 4) Check if user changed password after the token was issued
  //iat:issued at time : Phats hanhf khi naof
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password!. Please login again', 401)
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTE
  //Sau khi check tất cả mọi thứ ok
  //Kiểm tra xem headers gửi lên có token hay không
  // Verify token
  // kiểm tra xem User còn tồn tại hay không
  //Kiểm tra xem password thay đổi hay chưa
  //Thì gửi user đã check đi tiếp
  req.user = currentUser;
  next();
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array:['admin','lead-guide']
    //Vì thằng protect bên trên kia nó chạy trước và nó thêm req.user=curentUser
    //Nên ở middleware này ta có thể sử dụng tiếp req.user mà thằng protect đã tạo ra
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  console.log('olaaaaaaaaaaaaaaa');
});
exports.resetPassword = catchAsync((req, res, next) => {});
