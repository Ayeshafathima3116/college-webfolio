import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard.jsx";
import "./login.css";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function LoginApp() {
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // Check session
  useEffect(() => {
    fetch(`${BACKEND}/api/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          navigate("/dashboard");
        }
      })
      .catch(() => {});
  }, [BACKEND, navigate]);

  // Load Google script only if not logged in
  useEffect(() => {
    if (user) return;
    if (!document.getElementById("google-script")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-script";
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, [user]);

  async function fetchMeAndGo() {
    try {
      const me = await fetch(`${BACKEND}/api/auth/me`, { credentials: "include" });
      if (me.ok) {
        const full = await me.json();
        setUser(full);
        navigate("/dashboard");
      }
    } catch {}
  }

  // Google sign-in setup
  function initializeGoogleSignIn() {
    if (!window.google || !CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        setErr("");
        try {
          const res = await fetch(`${BACKEND}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential: response.credential }),
          });

          const data = await res.json();
          if (!res.ok) {
            setErr(data.message || "Auth failed");
            return;
          }

          // Get full profile (has department, etc.) and go to dashboard
          await fetchMeAndGo();
        } catch {
          setErr("Network error");
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignInDiv"),
      { theme: "outline", size: "large", text: "continue_with", shape: "pill" }
    );
  }

  // Logout
  const handleLogout = async () => {
    await fetch(`${BACKEND}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    navigate("/");
  };

  return (
    <Routes>
      {/* Login Page */}
      <Route
        path="/"
        element={
          <div className="app-container">
            <div className="card-login">
              <h1>Welcome</h1>
              <p className="subtitle">Sign in to continue</p>
              <div id="googleSignInDiv" className="google-btn" />
              <p className="note">📌 Use your college email to update your Webfolio details.</p>
              {err && <p className="error">{err}</p>}
            </div>
          </div>
        }
      />

      {/* Dashboard (decides whether to show the form modal) */}
      <Route
        path="/dashboard"
        element={<Dashboard user={user} onLogout={handleLogout} />}
      />
    </Routes>
  );
}
