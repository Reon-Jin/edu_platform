import React, { useEffect, useState } from 'react';
import { Line, Doughnut, Bar, Radar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend } from 'chart.js';
import { fetchDashboard } from '../api/admin';
import '../index.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend);

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

  if (error) return (<div className="container"><div className="card">{error}</div></div>);
  if (!data) return (<div className="container"><div className="card">加载中...</div></div>);

  const activityLabels = data.activity.trend.map(t => t.date);
  const teacherSeries = data.activity.trend.map(t => t.teacher);
  const studentSeries = data.activity.trend.map(t => t.student);

  const ratioData = {
    labels: ['教师', '学生'],
    datasets: [{
      data: [data.activity.ratio.teacher || 0, data.activity.ratio.student || 0],
      backgroundColor: ['#36A2EB', '#FF6384'],
    }],
  };

  const scoreData = {
    labels: ['A', 'B', 'C', 'D', 'F'],
    datasets: [{
      label: '人数',
      data: ['A','B','C','D','F'].map(k => data.homework.score_dist[k] || 0),
      backgroundColor: '#4BC0C0',
    }],
  };

  const masteryLabels = Object.keys(data.homework.mastery);
  const masteryData = {
    labels: masteryLabels,
    datasets: [{
      label: '掌握度(%)',
      data: masteryLabels.map(k => (data.homework.mastery[k] * 100).toFixed(2)),
      backgroundColor: 'rgba(54,162,235,0.4)',
      borderColor: 'rgba(54,162,235,1)',
    }],
  };

  const monthKeys = Object.keys(data.courseware_prod.month).sort();
  const cwMonthData = {
    labels: monthKeys,
    datasets: [{
      label: '课件数',
      data: monthKeys.map(k => data.courseware_prod.month[k]),
      backgroundColor: 'rgba(255,99,132,0.4)',
      borderColor: 'rgba(255,99,132,1)',
    }],
  };

  const qLabels = Object.keys(data.courseware_prod.qtype);
  const qData = {
    labels: qLabels,
    datasets: [{
      data: qLabels.map(k => data.courseware_prod.qtype[k]),
      backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF'],
    }],
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="card">
        <h2>数据概览</h2>
        <ul>
          <li>教师数量: {data.counts.teacher}</li>
          <li>学生数量: {data.counts.student}</li>
          <li>课件数量: {data.counts.courseware}</li>
          <li>练习数量: {data.counts.exercise}</li>
          <li>平均作业完成时长(小时): {data.learning.avg_completion_hours.toFixed(2)}</li>
          <li>接口平均响应(ms): {data.system.avg_response_ms.toFixed(2)}</li>
          <li>系统错误率: {(data.system.error_rate*100).toFixed(2)}%</li>
        </ul>
      </div>
      <div className="card">
        <h3>活跃度趋势 (30天)</h3>
        <Line data={{
          labels: activityLabels,
          datasets: [
            { label: '教师', data: teacherSeries, borderColor: '#36A2EB', backgroundColor: 'rgba(54,162,235,0.4)' },
            { label: '学生', data: studentSeries, borderColor: '#FF6384', backgroundColor: 'rgba(255,99,132,0.4)' },
          ],
        }} />
      </div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        <div style={{ width: '300px' }}>
          <h4>当前活跃角色占比</h4>
          <Doughnut data={ratioData} />
        </div>
        <div style={{ width: '300px' }}>
          <h4>成绩分布</h4>
          <Bar data={scoreData} />
        </div>
        <div style={{ width: '300px' }}>
          <h4>知识点掌握度</h4>
          <Radar data={masteryData} />
        </div>
      </div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        <div style={{ width: '400px' }}>
          <h4>课件生成数量(按月)</h4>
          <Line data={cwMonthData} />
        </div>
        <div style={{ width: '400px' }}>
          <h4>题型占比</h4>
          <Pie data={qData} />
        </div>
      </div>
    </div>
  );
}
