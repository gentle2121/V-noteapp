// src/api/noteService.ts
import axios from "axios";

const BASE_URL = "http://localhost:5000/api"; // 👈 your backend URL

export interface Note {
  id: string;
  title: string;
  content: string;
  eventDate?: string;
  remind?: boolean;
  createdAt?: string;
}

export const NoteService = {
  async getAll(): Promise<Note[]> {
    const res = await axios.get(`${BASE_URL}/notes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data;
  },

  async create(note: Omit<Note, "id" | "createdAt">): Promise<Note> {
    const res = await axios.post(`${BASE_URL}/notes`, note, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data;
  },

  async update(id: string, note: Partial<Note>): Promise<Note> {
    const res = await axios.put(`${BASE_URL}/notes/${id}`, note, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/notes/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },
};
