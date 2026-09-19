const express = require("express");
const router = express.Router();
const passport = require("../../services/google.service");
const { protect } = require("../../middlewares/auth.middleware");
const {
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
} = require("./auth.controller");

// Public routes
router.post("/register", register);
router.post("/student-login", studentLogin);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/admin-login", adminLogin);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const { user, token } = req.user;
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectPath = user?.role === "ADMIN" ? "/admin" : "/student";
    res.redirect(`${frontendBase}${redirectPath}?token=${token}`);
  }
);

// GitHub OAuth
router.get("/github/url", protect, generateGithubUrl);
router.get("/github/callback", githubOAuthCallback);
router.post("/github/callback", protect, githubCallback);

// Private routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;