import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function StudentChatHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      const resp = await api.get("/student/ai/history");
      setHistory(resp.data);
    };
    load();
  }, []);

  return (
    <div>
      <h2>历史记录</h2>
      <ul>
        {history.map((item) => (
          <li key={item.id}>
            Q: {item.question} <br />A: {item.answer}
          </li>
        ))}
      </ul>
    </div>
  );
}
