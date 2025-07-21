import React, { useEffect, useState } from 'react';
import { fetchCoursewares, shareCourseware, downloadCourseware } from '../api/admin';
import { Link } from 'react-router-dom';
import '../ui/AdminCoursewares.css';
import { formatDateTime } from '../utils';

export default function AdminCoursewares() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 根据 topic 进行搜索过滤
  const filtered = list.filter((c) =>
    c.topic.toLowerCase().includes(search.toLowerCase())
  );

  // 加载课件列表
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCoursewares();
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

  // 共享课件
  const handleShare = async (cid) => {
    try {
      await shareCourseware(cid);
      alert('已共享');
      load();
    } catch (err) {
      console.error(err);
      alert('操作失败');
    }
  };

  // 下载课件
  const handleDownload = async (cid, topic) => {
    try {
      const blob = await downloadCourseware(cid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson_${topic}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('下载失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="toolbar">
          <h2>课件管理</h2>
          <input
            className="input"
            placeholder="🔍 搜索课件"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="table-wrapper">
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
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.topic}</td>
                    <td>{c.teacher_username}</td>
                    <td>{formatDateTime(c.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="button button-share"
                          onClick={() => handleShare(c.id)}
                          disabled={c.topic.endsWith('-public')}
                        >
                          {c.topic.endsWith('-public') ? '已共享' : '共享'}
                        </button>
                        <button
                          className="button button-download"
                          onClick={() => handleDownload(c.id, c.topic)}
                        >
                          下载
                        </button>
                        <Link
                          className="button button-edit"
                          to={`/admin/courseware/${c.id}/edit`}
                        >
                          编辑
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
