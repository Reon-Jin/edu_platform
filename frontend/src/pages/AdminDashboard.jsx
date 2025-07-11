import React, { useEffect, useState } from 'react';
import { fetchDashboard } from '../api/admin';
import '../index.css';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetchDashboard();
        setData(d);
      } catch (err) {
        setError('加载失败');
      }
    };
    load();
  }, []);

  if (error) {
    return <div className="container"><div className="card">{error}</div></div>;
  }
  if (!data) {
    return <div className="container"><div className="card">加载中...</div></div>;
  }
  return (
    <div className="container">
      <div className="card">
        <h2>数据概览</h2>
        <ul>
          <li>教师数量: {data.teacher_count}</li>
          <li>学生数量: {data.student_count}</li>
          <li>课件数量: {data.courseware_count}</li>
          <li>练习数量: {data.exercise_count}</li>
          <li>教师今日使用次数: {data.teacher_usage_today}</li>
          <li>学生今日使用次数: {data.student_usage_today}</li>
        </ul>
      </div>
    </div>
  );
}
