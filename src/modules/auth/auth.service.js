// Bản tạm để test API, Luồng 1 (UC02) sẽ thay bằng bản chính thức.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../users/user.model.js");
const AppError = require("../../common/errors/AppError.js");

const publicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  accountStatus: user.accountStatus,
});

// UC02 - đăng nhập: kiểm tra email + mật khẩu, chặn tài khoản BANNED, cấp JWT
const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, "Email hoặc mật khẩu không đúng");
  }
  if (user.accountStatus === "BANNED") {
    throw new AppError(403, "Tài khoản đã bị khóa");
  }

  // ghi cả id và sub để dùng được với middleware auth của các nhánh khác
  const token = jwt.sign(
    { id: user._id, sub: user._id, role: user.role },
    process.env.JWT_SECRET || "fruit-fresh-course-secret",
    { expiresIn: "1d" },
  );
  return { token, user: publicUser(user) };
};

// Đăng ký tài khoản Customer
const register = async ({ fullName, email, password, phone }) => {
  if (!fullName || !email || !password) {
    throw new AppError(400, "Vui lòng nhập họ tên, email và mật khẩu");
  }
  if (password.length < 6) {
    throw new AppError(400, "Mật khẩu tối thiểu 6 ký tự");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError(400, "Email đã được sử dụng");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    phone: phone ? phone.trim() : undefined,
    role: "CUSTOMER",
    accountStatus: "ACTIVE",
  });
  await user.save();

  const token = jwt.sign(
    { id: user._id, sub: user._id, role: user.role },
    process.env.JWT_SECRET || "fruit-fresh-course-secret",
    { expiresIn: "1d" },
  );
  return { token, user: publicUser(user) };
};

module.exports = { login, register, publicUser };
