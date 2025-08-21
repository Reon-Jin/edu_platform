import React, { useState } from "react";
import {
  prepareLessonMarkdown,
  downloadCoursewarePdf,
  saveCourseware,
  updateCourseware,
  optimizeLesson,
} from "../api/teacher";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../index.css";            // 全局样式
import "../ui/teacher-lesson.css"; // 本页样式（含 .tl-loading 居中覆盖）
import ShootingStars from "./ShootingStars";

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
    setSaved(false);
    setLoading(true);
    try {
      const md = await prepareLessonMarkdown({ topic });
      setMarkdown(md);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "生成教案失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    try {
      if (cwId) {
        await updateCourseware(cwId, markdown);
        setSaved(true);
      } else {
        const savedCourseware = await saveCourseware({ topic });
        setSaved(true);
        setCwId(savedCourseware.id);
      }
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
      await updateCourseware(cwId, markdown);
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
      const newMd = await optimizeLesson({ topic, markdown, instruction });
      setMarkdown(newMd);
    } catch (err) {
      console.error(err);
      setError("AI 优化失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tl-container">
      <ShootingStars count={16} speed={1} zIndex={-1} />
      <div className="tl-card" aria-busy={loading}>
        <h2 className="tl-title">教案备课</h2>

        {error && <div className="tl-alert tl-alert-error">{error}</div>}
        {saved && <div className="tl-alert tl-alert-ok">教案已保存！</div>}

        <form onSubmit={handleGenerate} className="tl-form" autoComplete="off">
          <label className="tl-label" htmlFor="topic">主题</label>
          <input
            id="topic"
            className="tl-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="输入备课主题"
            aria-label="备课主题"
          />

          <div className="tl-actions-centered">
            <button
              className="tl-btn tl-btn-primary"
              type="submit"
              disabled={loading || !topic.trim()}
              aria-busy={loading}
            >
              {loading ? "生成中…" : "生成教案"}
            </button>
          </div>
        </form>

        {markdown && (
          <>
            <div className="tl-actions">
              <button className="tl-btn tl-btn-glass" onClick={handleOptimize}>
                AI 优化
              </button>

              <button className="tl-btn tl-btn-glass" onClick={handleSave}>
                保存教案
              </button>

              <button
                className="tl-btn tl-btn-outline"
                onClick={handleDownload}
                disabled={!saved}
                title={saved ? "下载 PDF" : "请先保存教案"}
              >
                下载 PDF
              </button>
            </div>

            <div className="tl-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>

      {/* ✅ 全屏、居中的加载遮罩：移到卡片外层 */}
      {loading && (
        <div className="tl-loading" role="alert" aria-live="assertive">
          <div className="tl-loader" aria-hidden="true">
            <span className="ring" />
            <span className="dot d1" />
            <span className="dot d2" />
            <span className="dot d3" />
            <span className="dot d4" />
          </div>
          <div className="tl-loading-text">AI 正在编排你的教案…</div>
        </div>
      )}
    </div>
  );
}
