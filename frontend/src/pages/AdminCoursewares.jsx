import React, { useEffect, useState } from 'react';
import { fetchCoursewares, shareCourseware } from '../api/admin';
import '../index.css';

export default function AdminCoursewares() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCoursewares();
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

  const handleShare = async (cid) => {
    try {
      await shareCourseware(cid);
      alert('已共享');
    } catch (err) {
      alert('操作失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>课件管理</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>主题</th>
                <th>教师</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.topic}</td>
                  <td>{c.teacher_id}</td>
                  <td>{c.created_at}</td>
                  <td>
                    <button className="button" onClick={() => handleShare(c.id)}>
                      共享
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
