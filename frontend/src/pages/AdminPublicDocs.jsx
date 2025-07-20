import React, { useEffect, useState, useRef } from 'react';
import {
  uploadPublicDoc,
  fetchPublicDocs,
  deletePublicDoc,
} from '../api/admin';
import '../index.css';
import { formatDateTime } from '../utils';

export default function AdminPublicDocs() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const filtered = list.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPublicDocs();
      setList(data);
    } catch (err) {
      console.error(err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    try {
      setUploading(true);
      await uploadPublicDoc(file);
      setUploading(false);
      load();
    } catch (err) {
      console.error(err);
      alert('上传失败');
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileRef.current && fileRef.current.click();
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除?')) return;
    try {
      await deletePublicDoc(id);
      load();
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>公共资料库</h2>
        <input
          className="input"
          placeholder="搜索文件"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
        <div
          className="upload-dropzone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={openFileDialog}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openFileDialog();
          }}
        >
          <input
            type="file"
            ref={fileRef}
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">⬆️</div>
          <p>拖拽文件到此处或点击上传</p>
          {uploading && <div>上传中...</div>}
        </div>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>文件名</th>
                <th>上传时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>{formatDateTime(d.uploaded_at)}</td>
                  <td className="actions-cell">
                    <button
                      className="icon-button tooltip"
                      onClick={() => handleDelete(d.id)}
                      aria-label="删除"
                    >
                      🗑️
                      <span className="tooltip-text">删除</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
