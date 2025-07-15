import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudentClass, leaveClass } from '../api/student';
import '../index.css';

export default function StudentClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);

  const handleLeave = async () => {
    if (!window.confirm('确认退出该班级吗？')) return;
    try {
      await leaveClass(cid);
      navigate(-1);
    } catch (err) {
      alert('退出失败');
    }
  };

  useEffect(() => {
    fetchStudentClass(cid).then(setInfo).catch(() => setInfo(null));
  }, [cid]);

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
          <button className="button" style={{ width: 'auto', marginBottom: '1rem' }} onClick={handleLeave}>
            退出班级
          </button>
        </div>
        <h2>{info.name}</h2>
        <p>班级ID: {info.id}</p>
        <p>学科: {info.subject}</p>
        <p>学生人数: {info.student_count}</p>
      </div>
    </div>
  );
}
