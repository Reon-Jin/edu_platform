// src/pages/StudentAiTeacher.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import renderMathInElement from "katex/contrib/auto-render";
import mermaid from "mermaid";
import "katex/dist/katex.min.css";
import "../ui/StudentAiTeacher.css"; // 仅用这份 CSS

function Mermaid({ chart }) {
  const ref = useRef(null);
  const id = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);
  useEffect(() => {
    if (!ref.current) return;
    try {
      mermaid.render(id.current, chart, (svg) => (ref.current.innerHTML = svg));
    } catch (e) {
      console.error(e);
    }
  }, [chart]);
  return <div ref={ref} />;
}

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

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
  }, []);

  const formatContent = (text) => {
    if (!text) return "";
    let processed = text
      .replace(/\\\((.+?)\\\)/gs, '$$$1$$')
      .replace(/\\\[(.+?)\\\]/gs, '$$$$$1$$$$')
      .replace(/(?<!\$)\$\s+([^$]*?)\s+\$(?!\$)/g, '$$$1$$')
      .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `\n$$${m.trim()}$$\n`);
    processed = processed
      .replace(/(^|\n)(graph (?:TD|LR)[\s\S]*?)(?=\n{2,}|$)/g, (_, p, g) => `${p}\`\`\`mermaid\n${g}\n\`\`\``)
      .replace(/\n{3,}/g, "\n\n");
    return processed;
  };

  const hotQuestions = [
    "如何解一元二次方程？",
    "写一首关于夏天的英文诗",
    "什么是 JavaScript 闭包？",
  ];

  // 初始化/加载会话
  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get("/student/ai/sessions");
        setSessions(r.data);
        let sid = sessionId ? parseInt(sessionId) : null;

        if (!sid) {
          if (r.data.length > 0) {
            sid = r.data[0].id;
          } else {
            if (!initSessionPromise) initSessionPromise = api.post("/student/ai/session");
            const created = await initSessionPromise;
            sid = created.data.id;
            initSessionPromise = null;
          }
        }
        setCurrent(sid);
        navigate(`/student/ai/${sid}`, { replace: true });
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [sessionId, navigate]);

  // 拉取消息
  useEffect(() => {
    if (!current) return;
    const loadMsgs = async () => {
      try {
        const r = await api.get(`/student/ai/session/${current}`);
        setMessages(r.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadMsgs();
  }, [current]);

  // 新消息滚动 & 数学渲染
  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth" });
    renderMathInElement(endRef.current.parentElement, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
    });
  }, [messages]);

  const send = async () => {
    if (!question || !current) return;
    const q = question;
    setQuestion("");

    const aiIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "user", content: q }, { role: "assistant", content: "" }]);

    const token = localStorage.getItem("token");
    const base = api.defaults.baseURL || "";
    const url = `${base}/student/ai/session/${current}/ask_stream?question=${encodeURIComponent(
      q
    )}&token=${token}&use_docs=${useDocs}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      const t = e.data;
      setMessages((prev) => {
        const list = [...prev];
        if (list[aiIndex]) {
          const aiMsg = list[aiIndex];
          const existing = aiMsg.content;
          const addition = t.startsWith(existing) ? t.slice(existing.length) : t;
          if (addition) list[aiIndex] = { ...aiMsg, content: existing + addition };
        }
        return list;
      });
    };
    es.onerror = async () => {
      es.close();
      try {
        const r = await api.get(`/student/ai/session/${current}`);
        setMessages(r.data);
      } catch (e) {
        console.error(e);
      }
    };
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
          const r = await api.post("/student/ai/session");
          navigate(`/student/ai/${r.data.id}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const newChat = async () => {
    try {
      const r = await api.post("/student/ai/session");
      setSessions((prev) => [r.data, ...prev]);
      setCurrent(r.data.id);
      setMessages([]);
      navigate(`/student/ai/${r.data.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    // 整页固定：1180px 宽，100vh 高（居中）
    <div className="ait-page">
      <div className="ait-wrap">
        {/* 左侧：会话管理（固定 300px 宽） */}
        <aside className="ait-sessions">
          <div className="ait-sessions-top">
            <div className="ait-brand">
              <div className="ait-dot" />
              <span>AI 教师</span>
            </div>
            <button className="ait-mini" onClick={newChat}>+ 新建</button>
          </div>

          <ul className="ait-session-list">
            {sessions.map((s, idx) => (
              <li key={s.id} className={`ait-session ${s.id === current ? "is-active" : ""}`}>
                <span className="ait-title" onClick={() => navigate(`/student/ai/${s.id}`)}>
                  {s.title || `对话${idx + 1}`}
                </span>
                <button className="ait-x" onClick={() => delSession(s.id)}>×</button>
              </li>
            ))}
          </ul>
        </aside>

        {/* 右侧：聊天区（固定网格，消息区固定高度；气泡固定大小可滚动） */}
        <section className="ait-chat">
          <div className="ait-head">
            <div className="ait-logo">🤖</div>
            <div>
              <div className="ait-h1">智能对话</div>
              <div className="ait-hint">深度解答 · 支持公式 / Mermaid 图</div>
            </div>
          </div>

          <div className="ait-tip">💡 输入完整问题可获得更精准回答。</div>

          <label className="ait-option">
            <input
              type="checkbox"
              checked={useDocs}
              onChange={(e) => setUseDocs(e.target.checked)}
            />
            <span>使用教师资料</span>
          </label>

          <div className="ait-msgs">
            {messages.map((m, idx) => (
              <div key={m.id || idx} className={`ait-row ${m.role === "user" ? "from-user" : "from-ai"}`}>
                <div className="ait-avatar">{m.role === "user" ? "我" : "AI"}</div>
                <div className="ait-bubble">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code({ inline, className, children, ...props }) {
                        const txt = String(children).replace(/\n$/, "");
                        if (!inline && (className === "language-mermaid" || className === "mermaid")) {
                          return <Mermaid chart={txt} />;
                        }
                        return <code className={className} {...props}>{children}</code>;
                      },
                    }}
                  >
                    {formatContent(m.content)}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="ait-chips">
            {hotQuestions.map((q) => (
              <button key={q} className="ait-chip" onClick={() => setQuestion(q)}>{q}</button>
            ))}
          </div>

          <div className="ait-input">
            <input
              className="ait-text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="请输入问题"
            />
            <div className="ait-actions">
              <button className="ait-icon" onClick={() => setQuestion("")} title="清空">🗑</button>
              <button className="ait-icon" title="保存">💾</button>
              <button className="ait-send" onClick={send}>发送</button>
            </div>
          </div>

          <div className="ait-foot">
            <a href="#">使用指南</a> · <a href="#">反馈</a>
          </div>
        </section>
      </div>
    </div>
  );
}
