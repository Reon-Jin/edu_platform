import React, { useEffect, useState } from 'react';
import {
  uploadPublicDoc,
  fetchPublicDocs,
  deletePublicDoc,
} from '../api/admin';
import '../index.css';

export default function AdminPublicDocs() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPublicDocs();
      setList(data);
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadPublicDoc(file);
      load();
    } catch (err) {
      alert('上传失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除?')) return;
    try {
      await deletePublicDoc(id);
      load();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>公共课件管理</h2>
        <div style={{ marginBottom: '1rem' }}>
          <input type="file" onChange={handleUpload} />
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
              {list.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>{d.uploaded_at}</td>
                  <td>
                    <button className="button" onClick={() => handleDelete(d.id)}>删除</button>
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
