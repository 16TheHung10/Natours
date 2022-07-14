const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const maxNameLength = 40;
const minNameLength = 10;
const maxPasswordLength = 40;
const minPasswordLength = 8;
const userSchema = mongoose.Schema({
  name: {
    type: String,
    require: [true, 'The name of user is required'],
    // unique: true,
    maxlength: [
      maxNameLength,
      `A name of user must have less or equal ${maxNameLength} characters`,
    ],
    minlength: [
      minNameLength,
      `A name of user must have more or equal ${minNameLength} characters`,
    ],
  },
  email: {
    type: String,
    require: [true, 'The email is required'],
    unique: true,
    lowercase: true, //convert to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
    },
    default: 'user',
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    require: [true, 'A password is required'],
    maxlength: [
      maxPasswordLength,
      `A name of user must have less or equal ${maxPasswordLength} characters`,
    ],
    minlength: [
      minPasswordLength,
      `A name of user must have more or equal ${minPasswordLength} characters`,
    ],
    select: false, //Không hiển thị ra ngoài output, cái confirmpassword kia ko lưu trên db nên ko cần
  },
  passwordConfirm: {
    require: [true, 'Please confirm your password'],
    type: String,
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'password confirm does not match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    console.log('saveeeeeeeeeeeeeeeee1');
    return next();
  }
  // Hash the password with cost of 12
  this.password = bcrypt.hash(this.password, 12);
  console.log('saveeeeeeeeeeeeeeeee2');
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});
userSchema.methods.correctPassword = async function (
  passwordOfUserFromRequest,
  passwordOfUserInDB
) {
  //this.password khoong truy cap duoc tai vi no dang select:false nen phai dung candidatePassword
  return await bcrypt.compare(passwordOfUserFromRequest, passwordOfUserInDB);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //Thời gian tạo token nhỏ hơn thời gian change password.
    return JWTTimestamp < changedTimestamp;
  }
  //FALSE mean not changed
  return false;
};
// userSchema.methods.createPasswordResetToken = function () {
//   //Chỉ là 1 đoạn mã random để sử dụng cho việc reset password.
//   //Dựa theo đoạn mã đó để có thể validate vài thứ
//   const resetToken = crypto.randomBytes(32).toString('hex');

//   //Ta cần encrypt resetToken để lưu lên db. nếu không khi hacker truy cập vào db
//   //và lấy được resetToken thì có thể thay đổi được password(password trên db đã bị encrypt nên thg hacker ko lấy đc)
//   this.passwordResetToken = crypto
//     .createHash('sha256')
//     .update(resetToken)
//     .digest('hex');
//   console.log({ resetToken }, { passwordResetToken: this.passwordResetToken });
//   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
//   return resetToken;
// };
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
userSchema.index({ name: 'text', email: 'text' });
const User = mongoose.model('User', userSchema);
module.exports = User;
