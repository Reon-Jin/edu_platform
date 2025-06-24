import React, { useState } from "react";
import { prepareLessonMarkdown, downloadCoursewarePdf, saveCourseware } from "../api/teacher";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";  // 引入 GitHub 风格的 Markdown 支持
import "../index.css";  // 引用全局样式
import NavButtons from "../components/NavButtons";

export default function TeacherLesson() {
  const [topic, setTopic] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [cwId, setCwId] = useState(null);  // 用于保存课件的 ID

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setMarkdown("");
    setLoading(true);
    setSaved(false);
    try {
      const md = await prepareLessonMarkdown({ topic });
      setMarkdown(md);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || "生成教案失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cwId) {
      setError("请先保存教案再下载 PDF");
      return;
    }
    try {
      const blob = await downloadCoursewarePdf(cwId); // 使用正确的 cw_id
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${topic}.pdf`; // 文件名称
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setError("下载 PDF 失败");
    }
  };

  const handleSave = async () => {
    setError("");
    try {
      const savedCourseware = await saveCourseware({ topic });
      setSaved(true);
      setCwId(savedCourseware.id);  // 获取并保存课件的 ID
    } catch (error) {
      console.error(error);
      setError("保存教案失败");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>教案备课</h2>
        <NavButtons />
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
          <button className="button" type="submit" disabled={loading}>
            {loading ? "生成中…" : "生成教案"}
          </button>
        </form>

        {markdown && (
          <>
            <div className="actions">
              <button className="button" onClick={handleSave}>
                保存教案
              </button>
              <button
                className="button"
                onClick={handleDownload}
                disabled={!saved} // 下载按钮在未保存时禁用
              >
                下载 PDF
              </button>
            </div>
            <div className="markdown-preview">
              <ReactMarkdown
                children={markdown}
                remarkPlugins={[remarkGfm]}  // 使用 GitHub 风格的扩展支持表格
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
