"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple authentication via API route
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid password. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Luma Labs</h1>
        <p>Routing Engine</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="password">Authentication Required</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary w-full">
            Continue &rarr;
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
          padding: 24px;
        }
        .login-card {
          width: 100%;
          max-width: 380px;
          padding: 40px;
          text-align: center;
          background: var(--background);
          border-radius: var(--radius);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
        }
        h1 {
          font-size: 18px;
          font-weight: 600;
          color: var(--foreground);
          margin-bottom: 4px;
        }
        p {
          color: var(--muted-foreground);
          font-size: 14px;
          margin-bottom: 32px;
        }
        .form-group {
          text-align: left;
          margin-bottom: 24px;
        }
        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .toggle-password {
          position: absolute;
          right: 12px;
          font-size: 14px;
          color: var(--muted-foreground);
          transition: var(--transition);
        }
        .toggle-password:hover {
          color: var(--foreground);
        }
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--muted-foreground);
        }
        .w-full {
          width: 100%;
          display: flex;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          padding: 8px 16px;
        }
        .error-message {
          color: var(--accent-secondary);
          background: rgba(235, 87, 87, 0.1);
          padding: 8px;
          border-radius: var(--radius);
          font-size: 12px;
          margin: -8px 0 16px 0;
          text-align: left;
        }
      `}</style>
    </div>
  );
}
