

import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/signup");
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to NoteApp</h1>
        <p>Keep your thoughts, reminders, and ideas safe in one place.</p>
        <button className="home-btn" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;
