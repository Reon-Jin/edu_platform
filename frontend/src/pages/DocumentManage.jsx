import React, { useState, useEffect } from 'react';
import {
  uploadDocument,
  fetchMyDocuments,
  fetchPublicDocuments,
  setDocumentActive,
  deleteDocument,
} from '../api/teacher';
import '../index.css';

export default function DocumentManage() {
  const [tab, setTab] = useState('my');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (scope) => {
    setLoading(true);
    setError('');
    try {
      const data = scope === 'public' ? await fetchPublicDocuments() : await fetchMyDocuments();
      setList(data);
    } catch (e) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadDocument(file, false);
      load('my');
    } catch (err) {
      alert('上传失败');
    }
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
      alert('删除失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>资料管理</h2>
        <div style={{ marginBottom: '1rem' }}>
          <button className="button" style={{ width: 'auto', marginRight: '1rem' }} onClick={() => setTab('my')}>我的私有资料</button>
          <button className="button" style={{ width: 'auto' }} onClick={() => setTab('public')}>公共资料</button>
        </div>
        {tab === 'my' && (
          <div style={{ marginBottom: '1rem' }}>
            <input type="file" onChange={handleUpload} />
          </div>
        )}
        {error && <div className="error">{error}</div>}
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
              {list.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>{d.uploaded_at}</td>
                  <td>{d.is_active ? '已激活' : '未激活'}</td>
                  <td>
                    <button className="button" style={{ width: 'auto' }} onClick={() => handleActivate(d.id, !d.is_active)}>
                      {d.is_active ? '取消激活' : '激活'}
                    </button>
                    {tab === 'my' && (
                      <button className="button" style={{ width: 'auto', marginLeft: '0.5rem' }} onClick={() => handleDelete(d.id)}>
                        删除
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
