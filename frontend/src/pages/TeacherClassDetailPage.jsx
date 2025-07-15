import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTeacherClass, removeStudent, deleteClass } from '../api/teacher';
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

  const handleDisband = async () => {
    if (!window.confirm('确认解散该班级吗？')) return;
    try {
      await deleteClass(cid);
      navigate(-1);
    } catch (err) {
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

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="button" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(-1)}>
            返回
          </button>
          <button className="button" style={{ width: 'auto', marginBottom: '1rem' }} onClick={handleDisband}>
            解散班级
          </button>
        </div>
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
