/* eslint-disable no-unused-vars */
// src/pages/LessonPreview.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchLessonPreview, downloadCoursewarePdf } from "../api/teacher";  // 确保导入 downloadCoursewarePdf 函数
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";  // 用于支持 GitHub 风格的 Markdown（包括表格）
import "../index.css";

export default function LessonPreview() {
  const { cw_id } = useParams();  // 获取课件 ID
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");  // 用于显示错误信息
  const [downloadLoading, setDownloadLoading] = useState(false);  // 控制下载按钮的 loading 状态
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

  return (
    <div className="container">
      <div className="card">
        <button
          className="button"
          style={{ width: "auto", marginBottom: "1rem" }}
          onClick={() => navigate(-1)}
        >
          返回
        </button>
        <h2>教案预览</h2>
        {error && <div className="error">{error}</div>}  {/* 错误显示 */}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <>
            <div className="markdown-preview">
              <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
            </div>
            <div className="actions">
              <button
                className="button"
                onClick={handleDownload}
                disabled={downloadLoading}  // 下载按钮禁用状态
              >
                {downloadLoading ? "下载中..." : "下载 PDF"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
