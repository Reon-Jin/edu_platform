import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../index.css";

export default function StudentAiTeacher() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      const resp = await api.get("/student/ai/sessions");
      setSessions(resp.data);
      let sid = sessionId ? parseInt(sessionId) : null;
      if (!sid) {
        if (resp.data.length > 0) sid = resp.data[0].id;
        else {
          const r = await api.post("/student/ai/session");
          sid = r.data.id;
        }
      }
      setCurrent(sid);
      navigate(`/student/ai/${sid}`, { replace: true });
    };
    loadSessions();
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!current) return;
    const loadMsgs = async () => {
      const resp = await api.get(`/student/ai/session/${current}`);
      setMessages(resp.data);
    };
    loadMsgs();
  }, [current]);

  const send = async () => {
    if (!question || !current) return;
    const resp = await api.post(`/student/ai/session/${current}/ask`, { question });
    setMessages((prev) => [...prev, { role: "user", content: question }, resp.data]);
    setQuestion("");
  };

  const newChat = async () => {
    const resp = await api.post("/student/ai/session");
    setSessions((prev) => [resp.data, ...prev]);
    setCurrent(resp.data.id);
    setMessages([]);
    navigate(`/student/ai/${resp.data.id}`);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>AI 教师</h2>
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <button className="button" onClick={newChat}>新建聊天</button>
          <select value={current || ""} onChange={(e) => navigate(`/student/ai/${e.target.value}`)}>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <Link className="button" to="history">历史记录</Link>
        </div>
        <div style={{ marginTop: "1rem", minHeight: "300px" }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <strong>{m.role === "user" ? "我" : "AI"}:</strong>
              <div className="markdown-preview">
                <ReactMarkdown children={m.content} remarkPlugins={[remarkGfm]} />
              </div>
            </div>
          ))}
        </div>
        <input
          className="input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="请输入问题"
        />
        <div className="actions">
          <button className="button" onClick={send}>发送</button>
        </div>
      </div>
    </div>
  );
}
