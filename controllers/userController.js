const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(User.find(), req.query)
    .filter()
    .limitFields()
    .pagination()
    .sort()
    .search();
  const users = await feature.query;
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return new AppError('User does not exist', 404);
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet define',
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet define',
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet define',
  });
};
