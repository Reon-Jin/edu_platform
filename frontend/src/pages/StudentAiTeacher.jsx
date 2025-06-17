import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link } from "react-router-dom";

export default function StudentAiTeacher() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const send = async () => {
    if (!question) return;
    const resp = await api.post("/student/ai/ask", { question });
    setMessages((prev) => [...prev, { q: question, a: resp.data.answer }]);
    setQuestion("");
  };

  return (
    <div>
      <h2>AI 教师</h2>
      <div>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: "1rem" }}>
            <div>Q: {m.q}</div>
            <div>A: {m.a}</div>
          </div>
        ))}
      </div>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={send}>发送</button>
      <div>
        <Link to="history">历史记录</Link>
      </div>
    </div>
  );
}
