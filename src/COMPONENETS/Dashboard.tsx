import  { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, Search } from "lucide-react";
import "./Dashboard.css";
import {
  scheduleReminder,
  cancelReminder,
  rehydrateReminders,
} from "../utils/reminder";

const API_BASE_URL = "https://backend-noteap.onrender.com";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    eventDate: "",
    remind: false,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Setup Axios with Authorization
  const axiosInstance = axios.create({ baseURL: API_BASE_URL });
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
      setNotes(res.data || []);
      setFilteredNotes(res.data || []);
      rehydrateReminders(res.data || [], (id, title, body) =>
        showLocalNotification(title, body)
      );
    } catch (err) {
      console.error("❌ Notes fetch failed", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Add note
  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    try {
      setLoading(true);
      const res = await axiosInstance.post("/notes", newNote);
      const updatedNotes = [...notes, res.data];
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);

      if (res.data.remind && res.data.eventDate) {
        scheduleReminder(
          res.data._id,
          res.data.eventDate,
          res.data.title,
          res.data.content,
          notifyHandler
        );
      }

      setNewNote({ title: "", content: "", eventDate: "", remind: false });
      setShowModal(false);
    } catch (err) {
      console.error("❌ Add note failed", err);
      alert("Failed to save note");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Edit note
  async function handleEditNote() {
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
  async function handleDeleteNote(id) {
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

  // ✅ Notifications
  function showLocalNotification(title, body) {
    if (Notification.permission === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          tag: "noteapp-reminder",
          renotify: true,
        });
      });
    } else {
      alert(`${title}\n\n${body}`);
    }
  }

  const notifyHandler = (noteId, title, body) => {
    console.log("🔔 Reminder triggered for:", noteId);
    showLocalNotification(title, body);
  };
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  return (
    <div className="dashboard-container">
      
<header className="dashboard-header">
  <h2>Welcome back, {user ? user.name || user.email : "User"} 👋</h2>

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

      {/* View/Edit Modal */}
      {selectedNote && (
        <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {!isEditing ? (
              <>
                <h3>{selectedNote.title}</h3>
                <p>{selectedNote.content}</p>
                {selectedNote.eventDate && (
                  <p className="note-date">
                    Event Date:{" "}
                    {new Date(selectedNote.eventDate).toLocaleString()}
                  </p>
                )}
                {selectedNote.remind && <p>🔔 Reminder Enabled</p>}
                <div className="modal-actions">
                  <button
                    className="btn primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => handleDeleteNote(selectedNote._id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn"
                    onClick={() => setSelectedNote(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Edit Note</h3>
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) =>
                    setSelectedNote({ ...selectedNote, title: e.target.value })
                  }
                />
                <textarea
                  value={selectedNote.content}
                  onChange={(e) =>
                    setSelectedNote({
                      ...selectedNote,
                      content: e.target.value,
                    })
                  }
                />
                <label>Event Date</label>
                <input
                  type="datetime-local"
                  value={
                    selectedNote.eventDate
                      ? selectedNote.eventDate.slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedNote({
                      ...selectedNote,
                      eventDate: e.target.value,
                    })
                  }
                />
                <label className="remind-row">
                  <input
                    type="checkbox"
                    checked={selectedNote.remind}
                    onChange={(e) =>
                      setSelectedNote({
                        ...selectedNote,
                        remind: e.target.checked,
                      })
                    }
                  />
                  &nbsp;Remind me at event time
                </label>
                <div className="modal-actions">
                  <button
                    className="btn primary"
                    onClick={handleEditNote}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Note</h3>
            <form onSubmit={handleAddNote}>
              <input
                type="text"
                placeholder="Title"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Write your note..."
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
                required
              />
              <label className="small">Event Date (optional)</label>
              <input
                type="datetime-local"
                value={newNote.eventDate}
                onChange={(e) =>
                  setNewNote({ ...newNote, eventDate: e.target.value })
                }
              />
              <label className="remind-row">
                <input
                  type="checkbox"
                  checked={newNote.remind}
                  onChange={(e) =>
                    setNewNote({ ...newNote, remind: e.target.checked })
                  }
                />
                &nbsp;Remind me at event time
              </label>
              <button
                type="submit"
                className="btn primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Note"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <button className="floating-btn" onClick={() => setShowModal(true)}>
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Dashboard;
