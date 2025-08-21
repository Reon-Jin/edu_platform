/* src/pages/LessonPreview.jsx */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchLessonPreview, downloadCoursewarePdf, updateCourseware } from "../api/teacher";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../index.css";
import "../ui/courseware_edit.css";   // ⬅️ 新增：编辑模式使用的深色玻璃风样式

export default function LessonPreview() {
  const { cw_id } = useParams();
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [saving, setSaving] = useState(false);         // ⬅️ 新增：保存 loading
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      setError("");
      try {
        const previewData = await fetchLessonPreview(cw_id);
        setMarkdown(previewData.markdown || "");
      } catch (error) {
        console.error(error);
        setError("加载预览失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, [cw_id]);

  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      const blob = await downloadCoursewarePdf(cw_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${cw_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setError("下载 PDF 失败");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCourseware(cw_id, markdown);
      setEditMode(false); // 保存后回到预览（可按需保留在编辑）
    } catch (err) {
      console.error(err);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">加载中…</div>
      </div>
    );
  }

  return (
    <>
      {/* —— 预览模式：保留你原来的样式 —— */}
      {!editMode ? (
        <div className="container">
          <div className="card">
            <button
              className="button btn-tertiary"
              style={{ width: "auto", marginBottom: "1rem" }}
              onClick={() => navigate(-1)}
            >
              返回
            </button>
            <h2>教案预览</h2>
            {error && <div className="error">{error}</div>}

            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>

            <div className="actions">
              <button
                className="button btn-secondary"
                onClick={handleDownload}
                disabled={downloadLoading}
              >
                <i className="icon icon-download" /> {downloadLoading ? "下载中…" : "下载 PDF"}
              </button>
              <button
                className="button btn-secondary"
                onClick={() => setEditMode(true)}
              >
                <i className="icon icon-edit" /> 编辑
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* —— 编辑模式：使用深色玻璃科技风，与管理员端统一 —— */
        <div className="cw-container">
          <div className="cw-shell cw-card">
            {/* 顶部工具栏 */}
            <div className="cw-toolbar">
              <button className="cw-btn" onClick={() => setEditMode(false)}>返回预览</button>
              <div className="cw-spacer" />
              <button className="cw-btn cw-btn--ghost" onClick={handleSave} disabled={saving}>
                {saving ? "保存中…" : "保存"}
              </button>
              <button className="cw-btn cw-btn--primary" onClick={handleDownload} disabled={downloadLoading}>
                {downloadLoading ? "生成中…" : "下载 PDF"}
              </button>
            </div>

            {/* 左右两栏：左编辑 / 右预览 */}
            <div className="cw-grid">
              {/* 左：Markdown 源文本编辑器 */}
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

              {/* 右：渲染预览 */}
              <section className="cw-pane">
                <header className="cw-pane-head">
                  <h3>实时预览</h3>
                  {error && <span className="cw-error">{error}</span>}
                </header>
                <div className="cw-preview markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
