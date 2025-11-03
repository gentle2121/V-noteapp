import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // 🟢 NEW

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // 🟢 Start loading state

    try {
      const res = await axios.post("https://backend-noteap.onrender.com", formData);

      // Save token
      // localStorage.setItem("token", res.data.token);

localStorage.setItem("token", res.data.token);

      alert("Login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false); // 🟢 Stop loading
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p className="error-msg">{error}</p>}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* 🟢 Dynamic button state */}
        <button
          type="submit"
          className="login-btn"
          disabled={loading}
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <p className="redirect-text">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/signup")} className="link-text">
            Signup here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
