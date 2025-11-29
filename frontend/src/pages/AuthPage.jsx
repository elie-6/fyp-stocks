import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../api/api";
import "./AuthPage.css";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validators
  const validateEmail = (email) => email.includes("@");
  const validatePassword = (password) =>
    /[A-Z]/.test(password) && /\d/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Simple validations
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email must contain '@'.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must contain at least one capital letter and one number."
      );
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
        // successful login -> redirect to dashboard
        navigate("/");
      } else {
        await signupUser(email, password);
        // after signup also redirect to dashboard (user already gets token)
        navigate("/");
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      // fetch responses sometimes return plain text or structured JSON
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>

        <form onSubmit={handleSubmit}>
          <div className={`input-group ${email ? "filled" : ""}`}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <label>Email</label>
          </div>

          <div className={`input-group ${password ? "filled" : ""}`}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <label>Password</label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={() => {}}
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}
