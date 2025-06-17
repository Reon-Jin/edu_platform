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

  return (
    <div className="container">
      <div className="card">
        <h2>历史记录</h2>
        <ul>
          {history.map((item) => (
            <li key={item.id}>
              <Link to={`/student/ai/${item.id}`}>{item.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
