import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Link } from "react-router-dom";
import "../index.css";

export default function StudentChatHistory() {
  const [history, setHistory] = useState([]);

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
        <h2>历史记录</h2>
        <ul>
          {history.map((item) => (
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
