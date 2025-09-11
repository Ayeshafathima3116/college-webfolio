import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Components
import Dashboard from "./components/Dashboard.jsx";
import Landingpage from "./components/Landingpage.jsx";
import Login from "./components/login.jsx";

// Styles
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  // Check user session when app loads
  useEffect(() => {
    fetch(`${BACKEND}/api/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      })
      .catch(() => {});
  }, []);

  // Logout function
  const handleLogout = async () => {
    await fetch(`${BACKEND}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    navigate("/"); // Redirect to login page
  };

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landingpage />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Protected dashboard */}
      <Route
        path="/dashboard"
        element={<Dashboard user={user} onLogout={handleLogout} />}
      />
    </Routes>
  );
}
