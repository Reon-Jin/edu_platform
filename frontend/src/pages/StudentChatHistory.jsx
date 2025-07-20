import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import "../index.css";

export default function StudentChatHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = history.filter((h) =>
    h.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      const resp = await api.get("/student/ai/sessions");
      setHistory(resp.data);
    };
    load();
  }, []);

  const del = async (id) => {
    try {
      await api.delete(`/student/ai/session/${id}`);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <button
          className="button"
          style={{ width: "auto", marginBottom: "1rem" }}
          onClick={() => navigate(-1)}
        >
          返回
        </button>
        <h2>历史记录</h2>
        <input
          className="input"
          placeholder="搜索记录"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
        <ul>
          {filtered.map((item) => (
            <li key={item.id}>
              <Link to={`/student/ai/${item.id}`}>{item.title}</Link>
              <button
                className="button"
                style={{ marginLeft: "0.5rem" }}
                onClick={() => del(item.id)}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
