import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Check login status whenever route changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  // ✅ Detect if on dashboard
  const isDashboard = location.pathname === "/dashboard";

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="navbar-logo-link">
          NoteApp
        </Link>
      </div>

      {/* Hamburger only visible on small screens */}
      <div
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* ✅ Conditional rendering */}
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        {/* Always show Home */}
        <Link to="/" onClick={() => setMenuOpen(false)}>
          Home
        </Link>

        {/* If NOT logged in → show Login & Signup */}
        {!isLoggedIn && (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)}>
              Signup
            </Link>
          </>
        )}

        {/* If logged in AND on dashboard → only show Logout */}
        {isLoggedIn && isDashboard && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}

        {/* If logged in but NOT on dashboard → show Dashboard + Logout */}
        {isLoggedIn && !isDashboard && (
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
