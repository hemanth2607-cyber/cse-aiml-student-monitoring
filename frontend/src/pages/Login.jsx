import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mail, ShieldCheck, ArrowLeft, Lock, Chrome, Sparkles } from "lucide-react";
import AnimatedBackground from "../components/common/AnimatedBackground";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { type } = useParams();
  const [loginType, setLoginType] = useState(type === "admin" ? "admin" : "student");
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { studentLogin, studentRegister, adminLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setLoginType(type === "admin" ? "admin" : "student");
    setAuthMode("login");
    setPassword("");
    setConfirmPassword("");
    setEmail("");
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;

    if (loginType === "admin") {
      result = await adminLogin(email, password);
      if (result.success) navigate("/admin");
    } else if (authMode === "login") {
      result = await studentLogin(email, password);
      if (result.success) navigate("/student");
    } else {
      // Registration
      if (password !== confirmPassword) {
        setLoading(false);
        toast.error("Passwords do not match");
        return;
      }
      result = await studentRegister(email, password);
      if (result.success) {
        sessionStorage.setItem("pendingEmail", email);
        navigate("/verify");
      }
    }

    setLoading(false);

    if (result?.success) {
      toast.success(
        loginType === "admin"
          ? "Admin login successful!"
          : authMode === "login"
            ? "Student login successful!"
            : "Registration successful! Check your email for OTP."
      );
    } else {
      toast.error(result?.message || "Something went wrong");
    }
  };

  const handleGoogleLogin = () => {
    const apiBase =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
      "http://localhost:5000";
    window.location.href = `${apiBase}/api/v1/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-card p-8 sm:p-10 w-full max-w-md my-8 relative z-10"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-dark-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#e0e5ec] shadow-neu-flat flex items-center justify-center border border-white/80">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-center text-dark-800 mb-1.5 tracking-tight">
          {loginType === "admin" ? "Admin Access Portal" : "Student Workspace"}
        </h1>
        <p className="text-center text-xs text-dark-400 font-medium mb-6">
          {loginType === "admin" ? "Sign in to manage academic records" : "Log in or register your student account"}
        </p>

        {/* Student / Admin Segmented Switch */}
        <div className="neu-segmented mb-6">
          <Link
            to="/login/student"
            className={`neu-segmented-btn ${loginType === "student" ? "active text-indigo-600" : ""}`}
          >
            Student
          </Link>
          <Link
            to="/login/admin"
            className={`neu-segmented-btn ${loginType === "admin" ? "active text-indigo-600" : ""}`}
          >
            Admin
          </Link>
        </div>

        {/* Student Login/Register Tabs */}
        {loginType === "student" && (
          <div className="neu-segmented mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode("login"); setPassword(""); setConfirmPassword(""); }}
              className={`neu-segmented-btn ${authMode === "login" ? "active text-indigo-600" : ""}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("register"); setPassword(""); setConfirmPassword(""); }}
              className={`neu-segmented-btn ${authMode === "register" ? "active text-indigo-600" : ""}`}
            >
              Register
            </button>
          </div>
        )}

        {/* Google Sign-In – only for Student Login */}
        {loginType === "student" && authMode === "login" && (
          <>
            <button
              onClick={handleGoogleLogin}
              className="btn-secondary w-full py-3 text-sm font-bold flex items-center justify-center gap-2.5 mb-4"
            >
              <Chrome className="w-4 h-4 text-indigo-600" />
              Sign in with Google
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-dark-300/40" />
              <span className="text-dark-400 text-xs font-semibold uppercase tracking-wider">or email</span>
              <div className="flex-1 h-px bg-dark-300/40" />
            </div>
          </>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-dark">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 transition-colors pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neu-input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="label-dark">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 transition-colors pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neu-input pl-10"
                placeholder={
                  authMode === "register" ? "Create password (min 6 chars)" : "Enter password"
                }
              />
            </div>
          </div>

          {loginType === "student" && authMode === "register" && (
            <div>
              <label className="label-dark">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 transition-colors pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="neu-input pl-10"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-4 btn-primary disabled:opacity-50 text-sm font-bold`}
          >
            {loading
              ? "Authenticating..."
              : loginType === "admin"
                ? "Sign in as Admin"
                : authMode === "login"
                  ? "Student Login"
                  : "Register & Send OTP"}
          </button>
        </form>

        <p className="text-center text-[11px] text-dark-400 font-medium mt-6">
          {loginType === "student" && authMode === "login"
            ? "New here? Switch to Register to create your account."
            : loginType === "student" && authMode === "register"
              ? "A one-time password (OTP) will be dispatched to your inbox."
              : "Restricted to authorized CSE(AIML) faculty & administrators."}
        </p>
      </motion.div>
    </div>
  );
}