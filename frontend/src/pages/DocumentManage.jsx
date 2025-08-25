import React, { useState, useEffect, useRef } from 'react';
import {
  uploadDocument,
  fetchMyDocuments,
  fetchPublicDocuments,
  setDocumentActive,
  deleteDocument,
} from '../api/teacher';
import '../index.css';
import { formatDateTime } from '../utils';

export default function DocumentManage() {
  const [tab, setTab] = useState('my');
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const filtered = list.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  const load = async (scope) => {
    setLoading(true);
    setError('');
    try {
      const data =
        scope === 'public'
          ? await fetchPublicDocuments()
          : await fetchMyDocuments();
      setList(data);
    } catch (e) {
      console.error(e);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    try {
      setUploading(true);
      await uploadDocument(file, false, setProgress);
      setUploading(false);
      setProgress(0);
      load('my');
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

  const handleActivate = async (id, active) => {
    await setDocumentActive(id, active);
    load(tab);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除?')) return;
    try {
      await deleteDocument(id);
      load('my');
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>资料管理</h2>
        <div className="tab-container">
          <div className="tabs">
            <button
              className={`tab ${tab === 'my' ? 'active' : ''}`}
              onClick={() => setTab('my')}
            >
              我的私有资料
            </button>
            <button
              className={`tab ${tab === 'public' ? 'active' : ''}`}
              onClick={() => setTab('public')}
            >
              公共资料
            </button>
          </div>
          <select
            className="tab-select"
            value={tab}
            onChange={(e) => setTab(e.target.value)}
          >
            <option value="my">我的私有资料</option>
            <option value="public">公共资料</option>
          </select>
        </div>
        {tab === 'my' && (
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
            {uploading && (
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {uploading && <span className="progress-text">{progress}%</span>}
          </div>
        )}
        {error && <div className="error">{error}</div>}

        {/* 搜索框 + URL输入框 */}
        <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
          <input
            className="input"
            placeholder="搜索文件"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />

          <input
            className="input"
            placeholder="输入URL以批量上传文件"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                console.log('模拟批量上传 URL:', e.target.value);
                alert(`已模拟批量上传: ${e.target.value}`);
                e.target.value = '';
              }
            }}
            style={{ flex: 1 }}
          />
        </div>

        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>文件名</th>
                <th>上传时间</th>
                <th>激活状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>{formatDateTime(d.uploaded_at)}</td>
                  <td>
                    <span
                      className={`tag ${
                        d.is_active ? 'tag-green' : 'tag-gray'
                      }`}
                    >
                      {d.is_active ? '已激活' : '未激活'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="icon-button tooltip"
                      onClick={() => handleActivate(d.id, !d.is_active)}
                      aria-label={d.is_active ? '取消激活' : '激活'}
                    >
                      {d.is_active ? '🛑' : '✅'}
                      <span className="tooltip-text">
                        {d.is_active ? '取消激活' : '激活'}
                      </span>
                    </button>
                    {tab === 'my' && (
                      <button
                        className="icon-button tooltip"
                        onClick={() => handleDelete(d.id)}
                        aria-label="删除"
                        style={{ marginLeft: '0.25rem' }}
                      >
                        🗑️
                        <span className="tooltip-text">删除</span>
                      </button>
                    )}
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
