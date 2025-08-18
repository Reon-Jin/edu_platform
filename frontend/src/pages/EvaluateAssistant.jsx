import React, { useState, useEffect } from "react";
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
    num_single_choice: 5,
    num_multiple_choice: 0,
    num_fill_blank: 5,
    num_short_answer: 1,
    num_programming: 0,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const typeLabels = {
    single_choice: "单选题",
    multiple_choice: "多选题",
    fill_in_blank: "填空题",
    short_answer: "简答题",
    coding: "编程题",
  };

  useEffect(() => {
    const load = async () => {
      setAnalysis("");
      setAnalysisLoading(true);
      try {
        const resp = await fetchStudentAnalysis();
        setAnalysis(resp.analysis || "");
        if (resp.recommendation) {
          setForm((prev) => ({
            ...prev,
            ...resp.recommendation,
          }));
        }
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
    <div className="eval-container-horizontal">
      {/* 左侧：学习情况分析 */}
      <div className="eval-card analysis" style={{ flex: 1 }}>
        <h2 className="eval-title">评测助手</h2>
        {error && <div className="eval-error">{error}</div>}
        <div
          className="eval-markdown-preview"
          style={{ minHeight: "6rem", marginBottom: "1rem" }}
        >
          {analysisLoading ? (
            "正在努力为您分析学习情况…"
          ) : (
            <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
          )}
        </div>
      </div>

      {/* 右侧：自定义随练生成卡片 */}
      <div
        className="eval-card form-card"
        style={{ flexBasis: "320px", maxWidth: "100%" }}
      >
        <h2 className="eval-title">📝 自定义随练生成</h2>
        <form onSubmit={gen} className="eval-form">
          <label className="eval-group">
            主题
            <input
              className="eval-input"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              placeholder="如 李白、修辞、诗歌分析"
              required
            />
          </label>
          <label className="eval-group">
            单选题数量
            <input
              className="eval-input"
              type="number"
              name="num_single_choice"
              value={form.num_single_choice}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label className="eval-group">
            多选题数量
            <input
              className="eval-input"
              type="number"
              name="num_multiple_choice"
              value={form.num_multiple_choice}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label className="eval-group">
            填空题数量
            <input
              className="eval-input"
              type="number"
              name="num_fill_blank"
              value={form.num_fill_blank}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label className="eval-group">
            简答题数量
            <input
              className="eval-input"
              type="number"
              name="num_short_answer"
              value={form.num_short_answer}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label className="eval-group">
            编程题数量
            <input
              className="eval-input"
              type="number"
              name="num_programming"
              value={form.num_programming}
              onChange={handleChange}
              min="0"
            />
          </label>
          <button
            className="eval-button eval-button--primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "生成中…" : "生成随练"}
          </button>
        </form>

        {/* 随练结果预览（在右卡片内） */}
        {preview && (
          <div className="eval-preview" style={{ marginTop: "1.5rem" }}>
            <div className="eval-actions">
              <button
                className="eval-button"
                onClick={() => navigate("/student/self_practice")}
              >
                我的随练
              </button>
            </div>
            {preview.questions.map((block, bIdx) => (
              <div
                key={bIdx}
                className="eval-preview-block"
                style={{ marginBottom: "1rem" }}
              >
                <strong>{typeLabels[block.type] || block.type}</strong>
                {block.items.map((item, i) => (
                  <div
                    key={i}
                    className="eval-preview-item"
                    style={{ marginLeft: "1rem", marginTop: "0.5rem" }}
                  >
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
        )}
      </div>
    </div>
  );
}
