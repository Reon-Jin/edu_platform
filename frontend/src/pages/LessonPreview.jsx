/* src/pages/LessonPreview.jsx */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchLessonPreview, downloadCoursewarePdf, updateCourseware } from "../api/teacher";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";  // 用于支持 GitHub 风格的 Markdown（包括表格）
import "../index.css";

export default function LessonPreview() {
  const { cw_id } = useParams();  // 获取课件 ID
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");  // 用于显示错误信息
  const [downloadLoading, setDownloadLoading] = useState(false);  // 控制下载按钮的 loading 状态
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      setError("");  // 清空上次的错误信息
      try {
        const previewData = await fetchLessonPreview(cw_id);
        setMarkdown(previewData.markdown);
      } catch (error) {
        setError("加载预览失败，请稍后重试");  // 显示加载错误信息
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, [cw_id]);

  const handleDownload = async () => {
    setDownloadLoading(true);  // 开始加载下载
    try {
      const blob = await downloadCoursewarePdf(cw_id); // 调用下载 PDF 的 API
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${cw_id}.pdf`; // 设置下载文件的名称
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setError("下载 PDF 失败");  // 下载失败时显示错误信息
    } finally {
      setDownloadLoading(false);  // 结束下载 loading 状态
    }
  };

  const handleSave = async () => {
    try {
      await updateCourseware(cw_id, markdown);
      alert("已保存");
      setEditMode(false);
    } catch (err) {
      alert("保存失败");
    }
  };

  return (
    <div className="container">
      {/* 普通预览时只用 .card，编辑模式时加上 .wide-card */}
      <div className={editMode ? "card wide-card" : "card"}>
        <button
          className="button btn-tertiary"
          style={{ width: "auto", marginBottom: "1rem" }}
          onClick={() => navigate(-1)}
        >
          返回
        </button>
        <h2>教案预览</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : editMode ? (
          <div className="edit-layout">
            <textarea
              className="input edit-input"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
            />
            <div className="preview-column">
              <div className="actions" style={{ marginTop: 0 }}>
                {/* 保存教案 */}
                <button
                  className="button btn-secondary"
                  onClick={handleSave}
                >
                  <i className="icon icon-save" /> 保存
                </button>
                {/* 下载 PDF */}
                <button
                  className="button btn-secondary"
                  onClick={handleDownload}
                  disabled={downloadLoading}
                >
                  <i className="icon icon-download" />{" "}
                  {downloadLoading ? "下载中…" : "下载 PDF"}
                </button>
              </div>
              <div className="markdown-preview" style={{ marginTop: '1rem' }}>
                <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="markdown-preview">
              <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
            </div>
            <div className="actions">
              {/* 下载 PDF */}
              <button
                className="button btn-secondary"
                onClick={handleDownload}
                disabled={downloadLoading}
              >
                <i className="icon icon-download" />{" "}
                {downloadLoading ? "下载中…" : "下载 PDF"}
              </button>
              {/* 切换到编辑 */}
              <button
                className="button btn-secondary"
                onClick={() => setEditMode(true)}
              >
                <i className="icon icon-edit" /> 编辑
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
