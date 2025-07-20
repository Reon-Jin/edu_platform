import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudentList } from '../api/teacher';
import '../index.css';

export default function TeacherStudents() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = list.filter((s) =>
    s.username.toLowerCase().includes(search.toLowerCase())
  );
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchStudentList();
        setList(data);
      } catch (err) {
        console.error(err);
        setError('加载学生列表失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>学生列表</h2>
        <input
          className="input"
          placeholder="搜索学生"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.username}</td>
                  <td>
                    <button
                      className="button"
                      onClick={() => navigate(`/teacher/students/${s.id}`)}
                    >
                      查看学情
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
