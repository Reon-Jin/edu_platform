import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCoursewarePreview, updateCourseware, downloadCourseware } from '../api/admin';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../index.css';

export default function AdminCoursewareEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCoursewarePreview(id);
        setMarkdown(data.markdown || '');
      } catch (err) {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    try {
      await updateCourseware(id, markdown);
      alert('已保存');
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadCourseware(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('下载失败');
    }
  };

  if (loading) {
    return <div className="container"><div className="card">加载中...</div></div>;
  }

  return (
    <div className="container">
      <div className="card">
        <button className="button" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(-1)}>返回</button>
        {error && <div className="error">{error}</div>}
        <textarea className="input" style={{ height: '200px' }} value={markdown} onChange={e => setMarkdown(e.target.value)} />
        <div className="actions">
          <button className="button" onClick={handleSave}>保存</button>
          <button className="button" onClick={handleDownload}>下载 PDF</button>
        </div>
        <div className="markdown-preview">
          <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
        </div>
      </div>
    </div>
  );
}
