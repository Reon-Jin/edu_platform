import React, { useState } from "react";
import { prepareLessonMarkdown, downloadLessonPdf } from "../api/teacher";
import ReactMarkdown from "react-markdown";
import "../index.css";

export default function LessonPage() {
  const [topic, setTopic] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setMarkdown("");
    setLoading(true);
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
    try {
      const blob = await downloadLessonPdf({ topic });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${topic}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setError("下载 PDF 失败");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>教案备课</h2>
        {error && <div className="error">{error}</div>}
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
            <div style={{ margin: "1rem 0" }}>
              <button className="button" onClick={handleDownload}>
                下载 PDF
              </button>
            </div>
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
