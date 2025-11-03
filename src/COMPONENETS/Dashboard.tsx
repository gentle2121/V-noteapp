import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, Search, LogOut, User } from "lucide-react";
import "./Dashboard.css";
import {
  scheduleReminder,
  cancelReminder,
  rehydrateReminders,
} from "../utils/reminder";

// =========================
// ✅ TYPE DEFINITIONS
// =========================
interface Note {
  _id: string;
  title: string;
  content: string;
  eventDate?: string;
  remind?: boolean;
}

interface UserType {
  name?: string;
  email?: string;
}

const API_BASE_URL = "https://backend-noteap.onrender.com/api";

const Dashboard = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState<Note>({
    _id: "",
    title: "",
    content: "",
    eventDate: "",
    remind: false,
  });
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ Setup Axios with Authorization
  const axiosInstance = axios.create({ baseURL: API_BASE_URL });
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers)
      config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ✅ Load user & notes on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUser();
    fetchNotes();
  }, [navigate]);

  // ✅ Fetch logged-in user
  async function fetchUser() {
    try {
      const res = await axiosInstance.get("/auth/profile");
      setUser(res.data.user);
    } catch (err) {
      console.error("❌ User fetch failed", err);
      handleLogout();
    }
  }

  // ✅ Fetch notes
  async function fetchNotes() {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/notes");
      const data: Note[] = res.data || [];
      setNotes(data);
      setFilteredNotes(data);
      rehydrateReminders(data, (id, title, body) =>
        showLocalNotification(title, body)
      );
    } catch (err) {
      console.error("❌ Notes fetch failed", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Add new note
  async function handleAddNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    try {
      setLoading(true);
      const res = await axiosInstance.post("/notes", newNote);
      const added: Note = res.data;
      const updatedNotes = [...notes, added];
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);

      if (added.remind && added.eventDate) {
        scheduleReminder(
          added._id,
          added.eventDate,
          added.title,
          added.content,
          notifyHandler
        );
      }

      setNewNote({ _id: "", title: "", content: "", eventDate: "", remind: false });
      setShowModal(false);
    } catch (err) {
      console.error("❌ Add note failed", err);
      alert("Failed to save note");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Edit existing note
  async function handleEditNote() {
    if (!selectedNote) return;
    if (!selectedNote.title.trim() || !selectedNote.content.trim()) return;
    try {
      setLoading(true);
      const res = await axiosInstance.put(`/notes/${selectedNote._id}`, selectedNote);
      const updated = notes.map((n) =>
        n._id === selectedNote._id ? res.data : n
      );
      setNotes(updated);
      setFilteredNotes(updated);
      setIsEditing(false);
      setSelectedNote(res.data);

      cancelReminder(selectedNote._id);
      if (res.data.remind && res.data.eventDate) {
        scheduleReminder(
          res.data._id,
          res.data.eventDate,
          res.data.title,
          res.data.content,
          notifyHandler
        );
      }
    } catch (err) {
      console.error("❌ Update note failed", err);
      alert("Failed to update note");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Delete note
  async function handleDeleteNote(id: string) {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await axiosInstance.delete(`/notes/${id}`);
      cancelReminder(id);
      const updated = notes.filter((n) => n._id !== id);
      setNotes(updated);
      setFilteredNotes(updated);
      setSelectedNote(null);
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete note");
    }
  }

  // ✅ Filter notes on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNotes(notes);
      return;
    }
    const filtered = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNotes(filtered);
  }, [searchTerm, notes]);

  // ✅ Logout
  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // ✅ Navigate to Edit Profile
  function handleEditProfile() {
    navigate("/profile");
  }

  // ✅ Notifications
  function showLocalNotification(title: string, body: string) {
    if (Notification.permission === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          tag: "noteapp-reminder",
          requireInteraction: true,
        });
      });
    } else {
      alert(`${title}\n\n${body}`);
    }
  }

  const notifyHandler = (noteId: string, title: string, body: string) => {
    console.log("🔔 Reminder triggered for:", noteId);
    showLocalNotification(title, body);
  };

  // =========================
  // ✅ RENDER
  // =========================
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h2>Welcome back, {user ? user.name || user.email : "User"} 👋</h2>
        </div>

        <div className="header-right">
          <button className="btn small" onClick={handleEditProfile}>
            <User size={18} /> Edit Profile
          </button>
          <button className="btn small danger" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>

          <div
            className={`search-bar ${searchTerm || isSearchOpen ? "open" : ""}`}
          >
            <Search
              className="search-icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            />
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Notes grid */}
      <div className="notes-grid">
        {loading ? (
          <p>Loading notes...</p>
        ) : filteredNotes.length === 0 ? (
          <p>No notes found.</p>
        ) : (
          filteredNotes
            .slice()
            .reverse()
            .map((note) => (
              <div
                key={note._id}
                className={`note-card ${note.remind ? "note-reminder" : ""}`}
              >
                <h3>{note.title}</h3>
                <p>
                  {note.content.length > 100
                    ? note.content.slice(0, 100) + "..."
                    : note.content}
                </p>
                {note.eventDate && (
                  <small className="note-date">
                    {new Date(note.eventDate).toLocaleString()}
                  </small>
                )}
                <button
                  className="btn-view"
                  onClick={() => {
                    setSelectedNote(note);
                    setIsEditing(false);
                  }}
                >
                  View More
                </button>
              </div>
            ))
        )}
      </div>

      {/* Floating Add Button */}
      <button className="floating-btn" onClick={() => setShowModal(true)}>
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Dashboard;
