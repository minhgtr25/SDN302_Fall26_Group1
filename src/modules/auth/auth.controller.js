const authService = require("./auth.service.js");
const asyncHandler = require("../../common/utils/asyncHandler.js");
const { success } = require("../../common/utils/response.js");
const AppError = require("../../common/errors/AppError.js");

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    throw new AppError(400, "Email và mật khẩu là bắt buộc");
  }
  const data = await authService.login({ email: email.trim(), password });
  success(res, data, "Đăng nhập thành công");
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  success(res, data, "Đăng ký thành công", 201);
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  success(res, authService.publicUser(req.user));
});

module.exports = { login, register, me };
