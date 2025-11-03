import React, { useEffect, useState } from "react";
import "./Profile.css";

interface ProfileState {
  name: string;
  email: string;
  phoneNumber: string;
  avatarBase64?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
    phoneNumber: "",
    avatarBase64: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 🟢 Load profile data from backend
  useEffect(() => {
    const email = localStorage.getItem("profile_email");
    if (!email) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `https://backend-noteap.onrender.com?email=${email}`
        );
        const data = await res.json();
        if (data.success) {
          setProfile(data.user);
        } else {
          setMsg("No profile found. Please fill it out.");
        }
      } catch (error) {
        console.error(error);
        setMsg("Error fetching profile.");
      }
    };

    fetchProfile();
  }, []);

  // 🟢 Handle image upload (convert to base64)
  const handleImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({
        ...prev,
        avatarBase64: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // 🟢 Save profile to backend
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("https://backend-noteap.onrender.com", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Profile saved successfully!");
        localStorage.setItem("profile_email", profile.email);
      } else {
        setMsg(data.message || "Error saving profile");
      }
    } catch (error) {
      console.error(error);
      setMsg("Failed to save profile.");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleRemoveAvatar = () => {
    setProfile({ ...profile, avatarBase64: "" });
  };

  return (
    <div className="profile-page">
      <form className="profile-card" onSubmit={handleSave}>
        <h2>Your Profile</h2>

        <div className="avatar-row">
          <div className="avatar-preview">
            {profile.avatarBase64 ? (
              <img src={profile.avatarBase64} alt="avatar" />
            ) : (
              <div className="avatar-placeholder">No Image</div>
            )}
          </div>

          <div className="avatar-actions">
            <label className="btn">
              Choose Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImage(e.target.files?.[0])}
                hidden
              />
            </label>

            {profile.avatarBase64 && (
              <button
                type="button"
                className="btn secondary"
                onClick={handleRemoveAvatar}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="form-row">
          <label>Full Name</label>
          <input
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="Full Name"
          />
        </div>

        <div className="form-row">
          <label>Email</label>
          <input
            name="email"
            value={profile.email}
            onChange={handleChange}
            placeholder="Email Address"
          />
        </div>

        <div className="form-row">
          <label>Phone Number</label>
          <input
            name="phoneNumber"
            value={profile.phoneNumber}
            onChange={handleChange}
            placeholder="Phone Number"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
          <span className="status">{msg}</span>
        </div>
      </form>
    </div>
  );
};

export default Profile;
