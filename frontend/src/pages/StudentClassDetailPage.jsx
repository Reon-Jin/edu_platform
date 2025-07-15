import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudentClass } from '../api/student';
import '../index.css';

export default function StudentClassDetailPage() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);

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
        <button className="button" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(-1)}>
          返回
        </button>
        <h2>{info.name}</h2>
        <p>班级ID: {info.id}</p>
        <p>学科: {info.subject}</p>
        <p>学生人数: {info.student_count}</p>
      </div>
    </div>
  );
}
