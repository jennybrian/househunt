// src/components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const backgroundUrl = "https://images.unsplash.com/photo-1596654907140-cac29b49fca4?auto=format&fit=crop&w=1200&q=80";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login } = useAuth();

  const theme = {
    primary: "#0d4d4d",
    accent: "#00bfae",
    background: "#0c2d2d",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signup(email, password, displayName);
      }
    } catch (err) {
      // Friendly error messages
      let errorMessage = err.message;
      if (errorMessage.includes('auth/email-already-in-use')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (errorMessage.includes('auth/invalid-email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorMessage.includes('auth/weak-password')) {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (errorMessage.includes('auth/user-not-found')) {
        errorMessage = 'No account found with this email.';
      } else if (errorMessage.includes('auth/wrong-password')) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (errorMessage.includes('auth/invalid-credential')) {
        errorMessage = 'Invalid email or password. Please try again.';
      }
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        background: `linear-gradient(120deg, #0d4d4d 60%, #00bfae 100%)`,
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        fontFamily: "'Inter', 'Nunito', Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(13,77,77,0.75)",
          zIndex: 0,
        }}
      />

      {/* Login Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "white",
          borderRadius: 24,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          padding: "48px 40px",
          maxWidth: 450,
          width: "100%",
        }}
      >
        {/* Logo/Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1
            style={{
              color: theme.primary,
              fontWeight: 800,
              fontSize: 36,
              letterSpacing: "-1px",
              marginBottom: 8,
            }}
          >
            🏡 HouseHunt
          </h1>
          <p
            style={{
              color: "#666",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        {/* Error Message */}
        {localError && (
          <div
            style={{
              background: "#fee",
              border: "1px solid #fcc",
              color: "#c33",
              padding: "12px 16px",
              borderRadius: 12,
              marginBottom: 20,
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            {localError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          {/* Display Name (only for signup) */}
          {!isLogin && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  color: theme.primary,
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 12,
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = theme.accent)}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                required={!isLogin}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                color: theme.primary,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: 12,
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = theme.accent)}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                color: theme.primary,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: 12,
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = theme.accent)}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              required
              minLength="6"
            />
            {!isLogin && (
              <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#ccc" : theme.accent,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: loading ? "none" : "0 4px 12px rgba(0,191,174,0.3)",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#009688";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.background = theme.accent;
                e.currentTarget.style.transform = "none";
              }
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setLocalError('');
              setEmail('');
              setPassword('');
              setDisplayName('');
            }}
            style={{
              background: "none",
              border: "none",
              color: theme.accent,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isLogin ? "" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;