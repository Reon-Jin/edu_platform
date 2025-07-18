import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTeacherClass, removeStudent, deleteClass } from '../api/teacher';
import '../index.css';

export default function TeacherClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [search, setSearch] = useState('');
  const [asc, setAsc] = useState(true);

  const load = async () => {
    try {
      const data = await fetchTeacherClass(cid);
      setInfo(data);
    } catch {
      setInfo(null);
    }
  };

  useEffect(() => {
    load();
  }, [cid]);

  const handleRemove = async (sid) => {
    if (!window.confirm('确认删除该学生吗？')) return;
    try {
      await removeStudent(cid, sid);
      load();
      alert('已删除学生');
    } catch {
      alert('删除失败');
    }
  };

  const handleDisband = async () => {
    if (!window.confirm('确认解散该班级吗？')) return;
    try {
      await deleteClass(cid);
      alert('班级已解散');
      navigate(-1);
    } catch {
      alert('解散失败');
    }
  };

  if (!info) {
    return (
      <div className="container">
        <div className="card">加载中...</div>
      </div>
    );
  }

  const students = info.students
    .filter((s) => s.username.includes(search))
    .sort((a, b) =>
      asc ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username)
    );

  return (
    <div className="container" style={{ paddingBottom: '20px' }}>
      <div className="card">
        <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/teacher/lesson')}>首页</span>
          {' / '}
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/teacher/classes')}>班级管理</span>
          {' / '}
          <span>{info.name}</span>
        </div>

        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div>
            <strong>班级名称</strong>
            <div>{info.name}</div>
          </div>
          <div>
            <strong>ID</strong>
            <div>{info.id}</div>
          </div>
          <div>
            <strong>学科</strong>
            <div>{info.subject}</div>
          </div>
          <div>
            <strong>学生人数</strong>
            <div>{info.student_count}</div>
          </div>
        </div>

        <details open>
          <summary>学生列表</summary>
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                placeholder="搜索学生"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 'auto' }}
              />
              <button
                type="button"
                className="button btn-tertiary"
                style={{ width: 'auto' }}
                onClick={() => setAsc(!asc)}
              >
                {asc ? '升序' : '降序'}
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.username}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => navigate(`/teacher/students/${s.id}?cid=${cid}`)}
                      >
                        👁
                      </button>{' '}
                      <button type="button" className="icon-button">✉️</button>{' '}
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleRemove(s.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <details>
          <summary>作业统计</summary>
          <div style={{ padding: '0.5rem 0' }}>敬请期待...</div>
        </details>

        <details>
          <summary>设置</summary>
          <div style={{ padding: '0.5rem 0' }}>敬请期待...</div>
        </details>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            className="button btn-tertiary"
            style={{ width: 'auto' }}
            onClick={() => navigate(-1)}
          >
            ← 返回
          </button>
          <button
            className="button btn-tertiary"
            style={{ width: 'auto' }}
            onClick={handleDisband}
          >
            🗑 解散班级
          </button>
          <button className="button btn-tertiary" style={{ width: 'auto' }}>
            ✎ 编辑信息
          </button>
        </div>
      </div>
    </div>
  );
}
