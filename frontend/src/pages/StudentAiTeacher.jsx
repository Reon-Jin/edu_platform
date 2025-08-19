// src/pages/StudentAiTeacher.jsx

import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../ui/StudentAiTeacher.css";  // 与 JSX 同目录下的 CSS

let initSessionPromise = null;

export default function StudentAiTeacher() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [useDocs, setUseDocs] = useState(false);
  const endRef = useRef(null);

  // 常用的“热门问题”
  const hotQuestions = [
    "如何解一元二次方程？",
    "写一首关于夏天的英文诗",
    "什么是 JavaScript 闭包？",
  ];

  // —— 初始化 & 加载会话列表 —— //
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const resp = await api.get("/student/ai/sessions");
        setSessions(resp.data);
        let sid = sessionId ? parseInt(sessionId) : null;

        if (!sid) {
          if (resp.data.length > 0) {
            sid = resp.data[0].id;
          } else {
            if (!initSessionPromise) {
              initSessionPromise = api.post("/student/ai/session");
            }
            const r = await initSessionPromise;
            sid = r.data.id;
            initSessionPromise = null;
          }
        }

        setCurrent(sid);
        navigate(`/student/ai/${sid}`, { replace: true });
      } catch (err) {
        console.error(err);
      }
    };

    loadSessions();
  }, [sessionId, navigate]);

  // —— 根据 current 拉取消息 —— //
  useEffect(() => {
    if (!current) return;

    const loadMsgs = async () => {
      try {
        const resp = await api.get(`/student/ai/session/${current}`);
        setMessages(resp.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadMsgs();
  }, [current]);

  // —— 新消息时自动滚动到底部 —— //
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // —— 发送消息 —— //
  const send = async () => {
    if (!question || !current) return;
    const q = question;
    setQuestion("");
    const aiIndex = messages.length + 1; // index of upcoming AI message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", content: "" },
    ]);

    const token = localStorage.getItem("token");
    const base = api.defaults.baseURL || "";
    const url = `${base}/student/ai/session/${current}/ask_stream?question=${encodeURIComponent(
      q
    )}&token=${token}&use_docs=${useDocs}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      const t = e.data;
      setMessages((prev) => {
        const msgs = [...prev];
        if (msgs[aiIndex]) {
          msgs[aiIndex].content += t;
        }
        return msgs;
      });
    };
    es.onerror = async () => {
      es.close();
      try {
        const r = await api.get(`/student/ai/session/${current}`);
        setMessages(r.data);
      } catch (err) {
        console.error(err);
      }
    };
  };

  // —— 删除会话 —— //
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

  // —— 新建会话 —— //
  const newChat = async () => {
    try {
      const resp = await api.post("/student/ai/session");
      setSessions((prev) => [resp.data, ...prev]);
      setCurrent(resp.data.id);
      setMessages([]);
      navigate(`/student/ai/${resp.data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="sa-container">
      {/* —— 左侧会话管理 —— */}
      <aside className="sa-sidebar">
        <div className="sa-sidebar-header">
          <h3>会话管理</h3>
          <button className="sa-btn-mini" onClick={newChat}>
            + 新建
          </button>
        </div>
        <ul className="sa-session-list">
          {sessions.map((s, idx) => (
            <li
              key={s.id}
              className={`sa-session-item ${
                s.id === current ? "active" : ""
              }`}
            >
              <span
                className="sa-session-title"
                onClick={() => navigate(`/student/ai/${s.id}`)}
              >
                {s.title || `对话${idx + 1}`}
              </span>
              <button
                className="sa-icon-button"
                onClick={() => delSession(s.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* —— 右侧主界面 —— */}
      <section className="sa-main">
        {/* 顶部 Banner */}
        <div className="sa-banner">
          <img src="../../public/ailogo.png" alt="AI" className="sa-logo" />
          <h2>AI 教师</h2>
        </div>

        {/* 温馨提示 */}
        <div className="sa-tip">
          💡 建议输入完整的问题描述以获得更精准回答。
        </div>

        {/* 检索开关 */}
        <div className="sa-option">
          <label>
            <input
              type="checkbox"
              checked={useDocs}
              onChange={(e) => setUseDocs(e.target.checked)}
            />
            使用教师资料
          </label>
        </div>

        {/* 消息列表 */}
        <div className="sa-messages">
          {messages.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`sa-msg ${
                m.role === "user" ? "sa-msg-user" : "sa-msg-ai"
              }`}
            >
              <div className="sa-avatar">
                {m.role === "user" ? "我" : "AI"}
              </div>
              <div className="sa-bubble">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* 热门问题 chips */}
        <div className="sa-hot-qs">
          {hotQuestions.map((q) => (
            <button
              key={q}
              className="sa-chip"
              onClick={() => setQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* 输入区 + 假按钮 */}
        <div className="sa-input-area">
          <input
            className="sa-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请输入问题"
          />
          <div className="sa-input-actions">
            <button
              className="sa-icon-btn"
              onClick={() => setQuestion("")}
              title="清空"
            >
              🗑
            </button>
            <button className="sa-icon-btn" title="保存">
              💾
            </button>
            <button className="sa-send-btn" onClick={send}>
              发送
            </button>
          </div>
        </div>

        {/* 底部链接 */}
        <div className="sa-footer">
          <a href="#">使用指南</a> · <a href="#">反馈</a>
        </div>
      </section>
    </div>
  );
}
