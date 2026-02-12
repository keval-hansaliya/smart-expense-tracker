import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext"; // 1. Import useAuth
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. Get the login function

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 3. Capture the response from the server
      const res = await api.post("/auth/login", { email, password });
      
      // 4. Update the global state with user data (id, username, etc.)
      login(res.data); 
      
      // 5. Now navigate
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p>Sign in to your account</p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="auth-footer">
          Don’t have an account? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;