import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";


const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // 🟢 get current page route

  // ✅ Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location.pathname]); // re-check when route changes

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  // ✅ Detect if we are on the dashboard
  const isDashboard = location.pathname === "/dashboard";

  return (
    <nav className="navbar">
      
<div className="navbar-logo">
  <Link to="/" className="navbar-logo-link">
    NoteApp
  </Link>
</div>


      {/* Hamburger icon (only show if not on dashboard) */}
      {!isDashboard && (
        <div
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      {/* Navigation links */}
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>
          Home
        </Link>

        {/* 🟢 If user is NOT on dashboard, show the rest */}
        {!isDashboard && !isLoggedIn && (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)}>
              Signup
            </Link>
          </>
        )}

        {!isDashboard && isLoggedIn && (
          <>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
