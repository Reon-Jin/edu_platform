// src/pages/AdminCoursewareEdit.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCoursewarePreview, updateCourseware, downloadCourseware } from "../api/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../index.css";
import "../ui/courseware_edit.css";   // ⬅️ 新增这行

export default function AdminCoursewareEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCoursewarePreview(id);
        setMarkdown(data.markdown || "");
      } catch (err) {
        console.error(err);
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCourseware(id, markdown);
    } catch (err) {
      console.error(err);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await downloadCourseware(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("下载失败");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="cw-container">
        <div className="cw-card">加载中…</div>
      </div>
    );
  }

  return (
    <div className="cw-container">
      <div className="cw-shell cw-card">
        {/* 顶部工具栏 */}
        <div className="cw-toolbar">
          <button className="cw-btn" onClick={() => navigate(-1)}>返回</button>
          <div className="cw-spacer" />
          <button className="cw-btn cw-btn--ghost" onClick={handleSave} disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </button>
          <button className="cw-btn cw-btn--primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? "生成中…" : "下载 PDF"}
          </button>
        </div>

        {/* 主体两栏 */}
        <div className="cw-grid">
          {/* 左：编辑 */}
          <section className="cw-pane">
            <header className="cw-pane-head">
              <h3>源 Markdown</h3>
              <span className="cw-muted">{markdown.length} 字符</span>
            </header>
            <textarea
              className="cw-editor"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
            />
          </section>

          {/* 右：预览 */}
          <section className="cw-pane">
            <header className="cw-pane-head">
              <h3>预览</h3>
              {error && <span className="cw-error">{error}</span>}
            </header>
            <div className="cw-preview markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
