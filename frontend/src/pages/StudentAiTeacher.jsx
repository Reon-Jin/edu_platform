import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
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
  const endRef = useRef(null);

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

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const send = async () => {
    if (!question || !current) return;
    const q = question;
    setQuestion("");
    // 先展示用户消息
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    try {
      await api.post(`/student/ai/session/${current}/ask`, { question: q });
      const r = await api.get(`/student/ai/session/${current}`);
      setMessages(r.data);
    } catch (err) {
      console.error(err);
    }
  };

  const delSession = async (id) => {
    try {
      await api.delete(`/student/ai/session/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === current) {
        if (sessions.length > 1) {
          const next = sessions.filter((s) => s.id !== id)[0];
          navigate(`/student/ai/${next.id}`);
        } else {
          const resp = await api.post("/student/ai/session");
          navigate(`/student/ai/${resp.data.id}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
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
      <div className="card" style={{ display: "flex", flexDirection: "column" }}>
        {/* 菜单布局下无需返回按钮 */}
        <div style={{ display: "flex" }}>
          <div style={{ width: "180px", marginRight: "1rem", borderRight: "1px solid #E2E8F0", paddingRight: "1rem" }}>
            <button className="button" onClick={newChat} style={{ width: "100%" }}>新建聊天</button>
            <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
            {sessions.map((s, idx) => (
              <li key={s.id} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                <span
                  style={{ cursor: "pointer", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  onClick={() => navigate(`/student/ai/${s.id}`)}
                >
                  {s.title || `对话${idx + 1}`}
                </span>
                <button className="icon-button" onClick={() => delSession(s.id)} style={{ marginLeft: "0.25rem" }}>×</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <h2>AI 教师</h2>
          <div style={{ marginTop: "1rem", minHeight: "300px" }}>
            {messages.map((m, idx) => (
              <div
                key={m.id || idx}
                style={{ display: "flex", marginBottom: "1rem" }}
              >
              <div style={{ flex: 1 }}>
                <strong>{m.role === "user" ? "我" : "AI"}:</strong>
                <div className="markdown-preview">
                  <ReactMarkdown children={m.content} remarkPlugins={[remarkGfm]} />
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
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
    </div>
    </div>
  );
}
