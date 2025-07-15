import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTeacherClass, removeStudent } from '../api/teacher';
import '../index.css';

export default function TeacherClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);

  const load = async () => {
    try {
      const data = await fetchTeacherClass(cid);
      setInfo(data);
    } catch (err) {
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
    } catch (err) {
      alert('删除失败');
    }
  };

  if (!info) {
    return (
      <div className="container">
        <div className="card">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <button className="button" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(-1)}>
          返回
        </button>
        <h2>{info.name}</h2>
        <p>班级ID: {info.id}</p>
        <p>学科: {info.subject}</p>
        <p>学生人数: {info.student_count}</p>
        <h3>学生列表</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {info.students.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.username}</td>
                <td>
                  <button className="button" style={{ width: 'auto' }} onClick={() => handleRemove(s.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
