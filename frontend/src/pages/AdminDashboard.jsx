import React, { useEffect, useState } from 'react';
import { Line, Doughnut, Bar, Radar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchDashboard } from '../api/admin';
import '../ui/AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // 英文题型到中文的映射
  const qTypeMap = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    fill_in_blank: '填空题',
    short_answer: '简答题',
  };

  useEffect(() => {
    (async () => {
      try {
        const d = await fetchDashboard();
        setData(d);
      } catch (err) {
        console.error(err);
        setError('加载失败');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="container">
        <div className="card error-card">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="container">
        <div className="card loading-card">加载中...</div>
      </div>
    );
  }

  // 活跃度趋势 (30天)
  const activityLabels = data.activity.trend.map(t => t.date);
  const teacherSeries = data.activity.trend.map(t => t.teacher);
  const studentSeries = data.activity.trend.map(t => t.student);

  // 当前活跃角色占比
  const ratioData = {
    labels: ['教师', '学生'],
    datasets: [
      {
        data: [
          data.activity.ratio.teacher || 0,
          data.activity.ratio.student || 0,
        ],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverOffset: 4,
      },
    ],
  };

  // 成绩分布
  const scoreData = {
    labels: ['A', 'B', 'C', 'D', 'F'],
    datasets: [
      {
        label: '人数',
        data: ['A', 'B', 'C', 'D', 'F'].map(k => data.homework.score_dist[k] || 0),
        backgroundColor: '#4BC0C0',
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
    ],
  };

  // 知识点掌握度
  const masteryLabels = Object.keys(data.homework.mastery);
  const masteryData = {
    labels: masteryLabels,
    datasets: [
      {
        label: '掌握度 (%)',
        data: masteryLabels.map(k => (data.homework.mastery[k] * 100).toFixed(1)),
        backgroundColor: 'rgba(54,162,235,0.3)',
        borderColor: 'rgba(54,162,235,1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54,162,235,1)',
      },
    ],
  };

  // 课件生成 (按月)
  const monthKeys = Object.keys(data.courseware_prod.month).sort();
  const cwMonthData = {
    labels: monthKeys,
    datasets: [
      {
        label: '课件数',
        data: monthKeys.map(k => data.courseware_prod.month[k]),
        backgroundColor: 'rgba(255,99,132,0.3)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  // 题型占比：英文 key 映射为中文标签
  const qLabels = Object.keys(data.courseware_prod.qtype);
  const qData = {
    labels: qLabels.map(key => qTypeMap[key] || key),
    datasets: [
      {
        data: qLabels.map(key => data.courseware_prod.qtype[key]),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="dashboard">
      {/* 页面头部 */}
      <header className="dashboard-header">
        <h2 className="dashboard-title">平台管理看板</h2>
        <p className="dashboard-desc">
          实时监控教师、学生、课件和练习等关键指标。
        </p>
        <div className="dashboard-toolbar">
          <button className="btn">刷新</button>
          <button className="btn btn-primary">导出数据</button>
          <button className="btn">筛选</button>
        </div>
        <div className="dashboard-update-time">
          数据更新时间：{new Date().toLocaleString()}
        </div>
      </header>

      {/* 概览卡片 */}
      <section className="overview-section">
        <div className="overview-cards">
          <div className="card overview-card">
            <h4>教师数量</h4>
            <p>{data.counts.teacher}</p>
          </div>
          <div className="card overview-card">
            <h4>学生数量</h4>
            <p>{data.counts.student}</p>
          </div>
          <div className="card overview-card">
            <h4>课件数量</h4>
            <p>{data.counts.courseware}</p>
          </div>
          <div className="card overview-card">
            <h4>练习数量</h4>
            <p>{data.counts.exercise}</p>
          </div>
          <div className="card overview-card">
            <h4>平均完成时长 (h)</h4>
            <p>{data.learning.avg_completion_hours.toFixed(1)}</p>
          </div>
          <div className="card overview-card">
            <h4>平均响应时长 (ms)</h4>
            <p>{data.system.avg_response_ms.toFixed(1)}</p>
          </div>
        </div>
      </section>

      {/* 图表网格 */}
      <section className="charts-section">
        <div className="charts-grid">
          <div className="card chart-card">
            <div className="chart-card-header">
              <h4>活跃度趋势（30天）</h4>
              <button className="chart-export">导出</button>
            </div>
            <Line
              data={{
                labels: activityLabels,
                datasets: [
                  {
                    label: '教师',
                    data: teacherSeries,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54,162,235,0.3)',
                    tension: 0.3,
                  },
                  {
                    label: '学生',
                    data: studentSeries,
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255,99,132,0.3)',
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>

          <div className="card chart-card">
            <div className="chart-card-header">
              <h4>当前活跃角色占比</h4>
              <button className="chart-export">导出</button>
            </div>
            <Doughnut data={ratioData} />
          </div>

          <div className="card chart-card">
            <div className="chart-card-header">
              <h4>成绩分布</h4>
              <button className="chart-export">导出</button>
            </div>
            <Bar data={scoreData} options={{ scales: { y: { beginAtZero: true } } }} />
          </div>

          <div className="card chart-card">
            <div className="chart-card-header">
              <h4>知识点掌握度</h4>
              <button className="chart-export">导出</button>
            </div>
            <Radar data={masteryData} options={{ scales: { r: { beginAtZero: true } } }} />
          </div>

          <div className="card chart-card">
            <div className="chart-card-header">
              <h4>课件生成（按月）</h4>
              <button className="chart-export">导出</button>
            </div>
            <Line data={cwMonthData} options={{ plugins: { legend: { position: 'top' } } }} />
          </div>

          <div className="card chart-card">
            <div className="chart-card-header">
              <h4>题型占比</h4>
              <button className="chart-export">导出</button>
            </div>
            <Pie data={qData} />
          </div>
        </div>
      </section>
    </div>
  );
}
