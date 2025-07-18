import React, { useState } from "react";
import {
  prepareLessonMarkdown,
  downloadCoursewarePdf,
  saveCourseware,
  optimizeLesson,
} from "../api/teacher";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";  // 引入 GitHub 风格的 Markdown 支持
import "../index.css";  // 引用全局样式

export default function TeacherLesson() {
  const [topic, setTopic] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [cwId, setCwId] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setMarkdown("");
    setLoading(true);
    setSaved(false);
    try {
      const md = await prepareLessonMarkdown({ topic });
      setMarkdown(md);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "生成教案失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    try {
      const savedCourseware = await saveCourseware({ topic });
      setSaved(true);
      setCwId(savedCourseware.id);
    } catch (err) {
      console.error(err);
      setError("保存教案失败");
    }
  };

  const handleDownload = async () => {
    if (!cwId) {
      setError("请先保存教案再下载 PDF");
      return;
    }
    try {
      const blob = await downloadCoursewarePdf(cwId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${topic}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("下载 PDF 失败");
    }
  };

  const handleOptimize = async () => {
    const instruction = window.prompt("输入优化要求，例如：增加案例或调整结构");
    if (!instruction) return;
    setError("");
    setLoading(true);
    try {
      const newMd = await optimizeLesson({ markdown, instruction });
      setMarkdown(newMd);
    } catch (err) {
      console.error(err);
      setError("AI 优化失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>教案备课</h2>
        {error && <div className="error">{error}</div>}
        {saved && <div className="success">教案已保存！</div>}

        <form onSubmit={handleGenerate}>
          <label>
            主题
            <input
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              placeholder="输入备课主题"
            />
          </label>

          {/* 生成教案按钮 */}
          <div style={{ textAlign: "center" }}>
            <button
              className="generate-lesson-btn"
              type="submit"
              disabled={loading}
            >
              <i className="icon icon-generate" />{" "}
              {loading ? "生成中…" : "生成教案"}
            </button>
          </div>
        </form>

        {markdown && (
          <>
            <div
              className="actions"
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                margin: "1rem 0",
              }}
            >
              {/* 保存教案 */}
              <button
                className="button btn-secondary"
                onClick={handleSave}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  width: "30%",
                  minWidth: "120px",
                }}
              >
                <i className="icon icon-save" /> 保存教案
              </button>

              {/* AI 优化 */}
              <button
                className="button btn-secondary"
                onClick={handleOptimize}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  width: "30%",
                  minWidth: "120px",
                }}
              >
                <i className="icon icon-magic" /> AI优化
              </button>

              {/* 下载 PDF */}
              <button
                className="button btn-tertiary"
                onClick={handleDownload}
                disabled={!saved}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  width: "30%",
                  minWidth: "120px",
                }}
              >
                <i className="icon icon-download" /> 下载 PDF
              </button>
            </div>

            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
