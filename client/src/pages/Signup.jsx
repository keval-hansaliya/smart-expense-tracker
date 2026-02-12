import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/auth.css";

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Info, Step 2: OTP
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/signup", formData);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify-otp", { email: formData.email, otp });
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{step === 1 ? "Create account" : "Verify Email"}</h2>
        <p>{step === 1 ? "Start managing your finances" : `Enter the code sent to ${formData.email}`}</p>

        {error && <p className="error-text">{error}</p>}

        {step === 1 ? (
          <form onSubmit={handleSignupSubmit}>
            <input type="text" placeholder="Username" required
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            <input type="email" placeholder="Email address" required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input type="password" placeholder="Password (min 6 chars)" required
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <input type="text" placeholder="6-digit Code" value={otp} required maxLength="6"
              onChange={(e) => setOtp(e.target.value)} style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem' }} />
            <button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
            <button type="button" className="btn-link" onClick={() => setStep(1)}>Edit email</button>
          </form>
        )}
        <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}

export default Signup;