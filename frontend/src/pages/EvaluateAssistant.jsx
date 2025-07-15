import React, { useState, useEffect } from "react";
import api from "../api/api";
import { generateSelfPractice, fetchStudentAnalysis } from "../api/student";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../index.css";

export default function EvaluateAssistant() {
  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [form, setForm] = useState({
    topic: "",
    num_mcq: 5,
    num_fill_blank: 5,
    num_short_answer: 1,
    num_programming: 0,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setAnalysis("");
      setAnalysisLoading(true);
      try {
        const resp = await fetchStudentAnalysis();
        setAnalysis(resp.analysis || "");
      } catch (err) {
        console.error(err);
        setError("加载分析失败");
      } finally {
        setAnalysisLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name.startsWith("num_") ? Number(value) : value,
    }));
  };

  const gen = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await generateSelfPractice(form);
      setPreview(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        {/* 菜单布局下无需返回按钮 */}
        <h2>评测助手</h2>
        {error && <div className="error">{error}</div>}
        <div className="markdown-preview" style={{ minHeight: '6rem', marginBottom: '1rem' }}>
          {analysisLoading ? '正在努力为您分析学习情况…' : (
            <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
          )}
        </div>
        <form onSubmit={gen}>
          <label>
            主题
            <input
              className="input"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            选择题数量
            <input
              className="input"
              type="number"
              name="num_mcq"
              value={form.num_mcq}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label>
            填空题数量
            <input
              className="input"
              type="number"
              name="num_fill_blank"
              value={form.num_fill_blank}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label>
            简答题数量
            <input
              className="input"
              type="number"
              name="num_short_answer"
              value={form.num_short_answer}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label>
            编程题数量
            <input
              className="input"
              type="number"
              name="num_programming"
              value={form.num_programming}
              onChange={handleChange}
              min="0"
            />
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "生成中…" : "生成随练"}
          </button>
        </form>
        {preview && (
          <>
            <div className="actions">
              <button className="button" onClick={() => navigate("/student/self_practice")}>我的随练</button>
            </div>
            <div style={{ marginTop: "1rem" }}>
              {preview.questions.map((block, bIdx) => (
                <div key={bIdx} style={{ marginBottom: "1rem" }}>
                  <strong>{block.type}</strong>
                  {block.items.map((item, i) => (
                    <div key={i} style={{ marginLeft: "1rem" }}>
                      {item.question}
                      {item.options && (
                        <ul>
                          {item.options.map((opt, j) => (
                            <li key={j}>{opt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
