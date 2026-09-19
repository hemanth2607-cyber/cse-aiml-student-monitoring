const asyncHandler = require("../../utils/async-handler");
const ApiError = require("../../utils/api-error");
const ApiResponse = require("../../utils/api-response");
const authService = require("./auth.service");
const {
  registerSchema,
  studentLoginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  adminLoginSchema,
  githubCallbackSchema,
} = require("./auth.validator");

const register = asyncHandler(async (req, res) => {
  const { email, password } = registerSchema.parse(req.body);
  const result = await authService.studentRegister({ email, password });
  return ApiResponse.success(res, result, "Registration successful! OTP sent to your email.", 201);
});

const studentLogin = asyncHandler(async (req, res) => {
  const { email, password } = studentLoginSchema.parse(req.body);
  const { token, user } = await authService.studentLogin(email, password);

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, { token, user }, "Student login successful");
});

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = sendOtpSchema.parse(req.body);
  const result = await authService.sendOtpToEmail(email);
  return ApiResponse.success(res, result, "OTP sent successfully");
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = verifyOtpSchema.parse(req.body);
  const { token, user } = await authService.verifyOtpAndLogin({ email, otp });

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, { token, user }, "Email verified successfully");
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = adminLoginSchema.parse(req.body);
  const { token, user } = await authService.adminLogin(email, password);

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, { token, user }, "Admin login successful");
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  return ApiResponse.success(res, user, "User profile fetched");
});

const generateGithubUrl = asyncHandler(async (req, res) => {
  const studentId = req.query.studentId;
  let targetUserId = req.user.id;
  let redirectPath = "/student";

  if (studentId) {
    if (req.user.role !== "ADMIN") {
      throw new ApiError(403, "Only admins can authorize a student on their behalf.");
    }
    targetUserId = studentId;
    redirectPath = "/admin";
  }

  const url = await authService.getGithubOAuthUrl(targetUserId, redirectPath);
  return ApiResponse.success(res, { url }, "GitHub OAuth URL generated");
});

// Existing manual GitHub link (POST) – used by frontend AJAX linking
const githubCallback = asyncHandler(async (req, res) => {
  const { code } = githubCallbackSchema.parse(req.body);
  const result = await authService.linkGithubAccount(req.user.id, code);
  return ApiResponse.success(res, result, "GitHub account linked");
});

// NEW: GitHub OAuth redirect callback (GET)
const githubOAuthCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL}/student?error=github_failed`);
  }

  const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
  let parsedState = {};
  try {
    parsedState = JSON.parse(Buffer.from(state, "base64").toString());
  } catch {
    return res.redirect(`${frontendBase}/student?error=github_failed`);
  }

  const result = await authService.linkGithubViaOAuth(code, parsedState.targetUserId);
  const redirectPath = parsedState.redirectPath || "/student";
  const targetStudentId = parsedState.targetUserId;

  if (!result.success) {
    return res.redirect(`${frontendBase}${redirectPath}?error=github_failed&studentId=${targetStudentId}`);
  }

  return res.redirect(`${frontendBase}${redirectPath}?github=linked&studentId=${targetStudentId}`);
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("access_token");
  const result = await authService.logout();
  return ApiResponse.success(res, result, "Logged out");
});

module.exports = {
  register,
  studentLogin,
  sendOtp,
  verifyOtp,
  adminLogin,
  getMe,
  generateGithubUrl,
  githubCallback,
  githubOAuthCallback,
  logout,
};