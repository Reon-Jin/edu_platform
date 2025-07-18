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
        console.error(err);
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
      <h2>数据概览</h2>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div>教师数量</div>
          <div>{data.teacher_count}</div>
        </div>
        <div className="stat-card">
          <div>学生数量</div>
          <div>{data.student_count}</div>
        </div>
        <div className="stat-card">
          <div>课件数量</div>
          <div>{data.courseware_count}</div>
        </div>
        <div className="stat-card">
          <div>练习数量</div>
          <div>{data.exercise_count}</div>
        </div>
        <div className="stat-card">
          <div>教师今日使用次数</div>
          <div>{data.teacher_usage_today}</div>
        </div>
        <div className="stat-card">
          <div>学生今日使用次数</div>
          <div>{data.student_usage_today}</div>
        </div>
        <div className="stat-card">
          <div>教师本周使用次数</div>
          <div>{data.teacher_usage_week}</div>
        </div>
        <div className="stat-card">
          <div>学生本周使用次数</div>
          <div>{data.student_usage_week}</div>
        </div>
        <div className="stat-card">
          <div>教学效率指数(秒)</div>
          <div>{data.teaching_efficiency.toFixed ? data.teaching_efficiency.toFixed(2) : data.teaching_efficiency}</div>
        </div>
      </div>
    </div>
  );
}
