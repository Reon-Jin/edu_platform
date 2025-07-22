import React, { useEffect, useState } from 'react';
import { fetchUsers, deleteUser } from '../api/admin';
import '../index.css';

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = list.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const load = async (r) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUsers(r);
      setList(data);
    } catch (err) {
      console.error(err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(role);
  }, [role]);

  const handleDelete = async (uid) => {
    if (!window.confirm('确认删除该用户及其数据吗？')) return;
    try {
      await deleteUser(uid);
      load(role);
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>用户管理</h2>
        <div style={{ marginBottom: '1rem' }}>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">全部</option>
            <option value="admin">管理员</option>
            <option value="teacher">教师</option>
            <option value="student">学生</option>
          </select>
          <input
            className="input"
            placeholder="搜索用户"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 'auto', marginTop: 0, marginLeft: '0.5rem' }}
          />
        </div>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>角色</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    <button
                      className="admin-action-btn admin-delete-btn"
                      onClick={() => handleDelete(u.id)}
                    >
                      删除
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
