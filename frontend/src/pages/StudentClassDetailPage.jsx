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
      alert('已退出班级');
      navigate(-1);
    } catch {
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
    <div className="container" style={{ paddingBottom: '20px' }}>
      <div className="card">
        <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/student/homeworks')}>首页</span>
          {' / '}
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/student/classes')}>我的班级</span>
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            onClick={handleLeave}
          >
            退出班级
          </button>
        </div>
      </div>
    </div>
  );
}
