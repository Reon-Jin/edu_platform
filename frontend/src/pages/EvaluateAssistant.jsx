import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateSelfPractice, fetchStudentAnalysis } from "../api/student";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../ui/analysis.css";

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
  const [focusRight, setFocusRight] = useState(false); // 手动控制：扩大右侧
  const navigate = useNavigate();

  const typeLabels = {
    single_choice: "单选题",
    multiple_choice: "多选题",
    fill_in_blank: "填空题",
    short_answer: "简答题",
    coding: "编程题",
  };

  // -------- 主题多行文本自动增高 --------
  const topicRef = useRef(null);
  const TOPIC_MAX = 2000;

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

  useEffect(() => {
    const el = topicRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 320);
    el.style.height = `${next}px`;
  }, [form.topic]);

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

  // -------- 根据左侧文本“多少”自动收缩左栏、放大右栏 --------
  const analysisLength = useMemo(() => {
    const plain = (analysis || "").replace(/[#>*_`[\]()-]/g, "").replace(/\s+/g, " ").trim();
    return plain.length;
  }, [analysis]);

  // 小于该阈值视作“内容不多”，让右栏更宽
  const isCompact = analysisLength > 0 && analysisLength < 320;

  return (
    <div className="eval-page">
      <div
        className={[
          "eval-layout",
          isCompact ? "is-compact" : "",
          focusRight ? "is-focus-right" : "",
        ].join(" ").trim()}
      >
        {/* 左侧：学习情况分析 */}
        <section className="eval-card">
          <div className="eval-card-head">
            <h2 className="eval-title">评测助手</h2>
            <button
              type="button"
              className="eval-button eval-button--ghost"
              onClick={() => setFocusRight((v) => !v)}
              aria-pressed={focusRight}
              title={focusRight ? "还原布局" : "扩大右侧"}
            >
              {focusRight ? "还原" : "扩大右侧"}
            </button>
          </div>

          {error && <div className="eval-alert">{error}</div>}

          <div className="eval-md">
            {analysisLoading ? (
              <div className="eval-hint">正在努力为您分析学习情况…</div>
            ) : (
              <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
            )}
          </div>
        </section>

        {/* 右侧：自定义随练生成（sticky） */}
        <aside className="eval-card eval-panel">
          <h2 className="eval-title">📝 自定义随练生成</h2>

          <form onSubmit={gen} className="eval-form">
            <label className="eval-group">
              <span className="eval-label">主题</span>
              <textarea
                ref={topicRef}
                className="eval-input eval-textarea"
                name="topic"
                value={form.topic}
                onChange={handleChange}
                placeholder="如：修辞手法专项、李白专题复习、《沁园春·长沙》关键句背诵、易错点回炉……（支持多行输入）"
                rows={3}
                maxLength={TOPIC_MAX}
              />
              <div className="eval-help">
                <span>{form.topic.length}/{TOPIC_MAX}</span>
                <span className="eval-help-tip">自动增高，亦可拖拽调整高度</span>
              </div>
            </label>

            <label className="eval-group">
              <span className="eval-label">单选题数量</span>
              <input
                className="eval-input"
                type="number"
                name="num_single_choice"
                value={form.num_single_choice}
                onChange={handleChange}
                min="0"
                step="1"
                inputMode="numeric"
              />
            </label>

            <label className="eval-group">
              <span className="eval-label">多选题数量</span>
              <input
                className="eval-input"
                type="number"
                name="num_multiple_choice"
                value={form.num_multiple_choice}
                onChange={handleChange}
                min="0"
                step="1"
                inputMode="numeric"
              />
            </label>

            <label className="eval-group">
              <span className="eval-label">填空题数量</span>
              <input
                className="eval-input"
                type="number"
                name="num_fill_blank"
                value={form.num_fill_blank}
                onChange={handleChange}
                min="0"
                step="1"
                inputMode="numeric"
              />
            </label>

            <label className="eval-group">
              <span className="eval-label">简答题数量</span>
              <input
                className="eval-input"
                type="number"
                name="num_short_answer"
                value={form.num_short_answer}
                onChange={handleChange}
                min="0"
                step="1"
                inputMode="numeric"
              />
            </label>

            <label className="eval-group">
              <span className="eval-label">编程题数量</span>
              <input
                className="eval-input"
                type="number"
                name="num_programming"
                value={form.num_programming}
                onChange={handleChange}
                min="0"
                step="1"
                inputMode="numeric"
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

          {/* 随练结果预览（右侧卡片内可滚动） */}
          {preview && (
            <div className="eval-preview">
              <div className="eval-actions">
                <button
                  className="eval-button"
                  onClick={() => navigate("/student/self_practice")}
                >
                  我的随练
                </button>
              </div>
              {preview.questions.map((block, bIdx) => (
                <div key={bIdx} className="eval-preview-block">
                  <strong>{typeLabels[block.type] || block.type}</strong>
                  {block.items.map((item, i) => (
                    <div key={i} className="eval-preview-item">
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
        </aside>
      </div>
    </div>
  );
}
