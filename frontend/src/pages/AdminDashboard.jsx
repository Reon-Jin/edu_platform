import React, { useEffect, useState } from 'react';
import { Line, Bar, Radar, Pie } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';
import {
  fetchDashboard,
  fetchRealTimeOnline,
  fetchParticipationRates,
  fetchPerformanceMetrics,
  fetchTeacherStats,
  fetchNewCourseTrend,
} from '../api/admin';
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
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [online, setOnline] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [stats, setStats] = useState(null);
  const [courseTrend, setCourseTrend] = useState(null);
  const [error, setError] = useState('');

  const qTypeMap = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    fill_in_blank: '填空题',
    short_answer: '简答题',
    coding: '编程题',
  };

  useEffect(() => {
    (async () => {
      try {
        const [d, on, part, perf, stat, trend] = await Promise.all([
          fetchDashboard(),
          fetchRealTimeOnline(),
          fetchParticipationRates(),
          fetchPerformanceMetrics(),
          fetchTeacherStats(),
          fetchNewCourseTrend(),
        ]);
        setData(d);
        setOnline(on);
        setParticipation(part);
        setPerformance(perf);
        setStats(stat);
        setCourseTrend(trend);
      } catch (e) {
        console.error(e);
        setError('加载失败');
      }
    })();
  }, []);

  if (error) return <div className="card error-card">{error}</div>;
  if (!data || !online || !participation || !performance || !stats || !courseTrend) {
    return <div className="card loading-card">加载中...</div>;
  }

  // ===== 数据准备 =====
  const activityLabels = data.activity.trend.map(t => t.date);
  const teacherSeries = data.activity.trend.map(t => t.teacher);
  const studentSeries = data.activity.trend.map(t => t.student);

  const scoreData = {
    labels: ['A','B','C','D','F'],
    datasets: [{
      label: '人数',
      data: ['A','B','C','D','F'].map(k => data.homework.score_dist[k] || 0),
      backgroundColor: 'rgba(51,197,255,0.35)',
      borderColor: '#33C5FF',
      borderWidth: 1,
    }],
  };

  const masteryLabels = Object.keys(data.homework.mastery);
  const masteryData = {
    labels: masteryLabels,
    datasets: [{
      label: '掌握度 (%)',
      data: masteryLabels.map(k => +(data.homework.mastery[k] * 100).toFixed(1)),
      backgroundColor: 'rgba(80,160,255,0.2)',
      borderColor: '#50A0FF',
      pointBackgroundColor: '#50A0FF',
      borderWidth: 2,
    }],
  };

  const dayKeys = Object.keys(data.courseware_prod.day).sort();
  const cwDayData = {
    labels: dayKeys,
    datasets: [{
      label: '课件数',
      data: dayKeys.map(k => data.courseware_prod.day[k]),
      borderColor: '#9B59FF',
      backgroundColor: 'rgba(155,89,255,0.18)',
      tension: 0.35,
      fill: true,
    }],
  };

  const newCourseData = {
    labels: courseTrend.labels,
    datasets: [
      {
        label: '课程',
        data: courseTrend.course,
        borderColor: '#33C5FF',
        backgroundColor: 'rgba(51,197,255,0.18)',
        tension: 0.35,
        fill: true,
      },
      {
        label: '练习',
        data: courseTrend.exercise,
        borderColor: '#FF5D9E',
        backgroundColor: 'rgba(255,93,158,0.18)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const qLabels = Object.keys(data.courseware_prod.qtype);
  const qData = {
    labels: qLabels.map(k => qTypeMap[k] || k),
    datasets: [{
      data: qLabels.map(k => data.courseware_prod.qtype[k]),
      backgroundColor: ['#33C5FF','#50A0FF','#9B59FF','#17D1C3','#FF5D9E'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const subjectLabels = Object.keys(stats.classDistribution);
  const classDistData = {
    labels: subjectLabels,
    datasets: [{
      data: subjectLabels.map(s => stats.classDistribution[s].count),
      backgroundColor: ['#33C5FF','#50A0FF','#9B59FF','#17D1C3','#FF5D9E','#FAD648','#6EE7B7','#7DD3FC'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const classDistOptions = {
    plugins: {
      legend: { labels: { color: '#cfe3ff', boxWidth: 10 } },
      tooltip: {
        callbacks: {
          label: ctx => {
            const label = ctx.label || '';
            const names = stats.classDistribution[label].classes.join(', ');
            return `${label}: ${ctx.parsed}个班级\n${names}`;
          },
        },
      },
    }
  };

  // 统一图表暗色主题
  const darkChartOpts = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cfe3ff', usePointStyle: true, pointStyle: 'rectRounded' } },
      tooltip: { titleColor: '#0b1020', bodyColor: '#0b1020' },
    },
    scales: {
      x: {
        ticks: { color: '#b9c6e4', maxRotation: 0, autoSkip: true },
        grid: { color: 'rgba(255,255,255,0.06)' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#b9c6e4' },
        grid: { color: 'rgba(255,255,255,0.06)' }
      },
      r: {
        angleLines: { color: 'rgba(255,255,255,0.06)' },
        grid: { color: 'rgba(255,255,255,0.06)' },
        pointLabels: { color: '#cfe3ff' },
        ticks: { showLabelBackdrop: false, color: '#b9c6e4' }
      }
    }
  };

  const avail = (100 - performance.averageErrorRate * 100).toFixed(2);
  const practiceRate = (participation.practiceUsageRate * 100).toFixed(1) + '%';

  return (
    <div className="neo-dashboard-root">
      {/* 顶部 */}
      <header className="neo-header">
        <div className="neo-header-left">
          <h2 className="neo-title">平台管理看板</h2>
          <p className="neo-sub">实时监控教师、学生、课件与练习等关键指标</p>
          <div className="neo-actions">
            <button className="neo-btn">刷新</button>
            <button className="neo-btn neo-primary">导出数据</button>
            <button className="neo-btn">筛选</button>
          </div>
          <div className="neo-time">数据更新时间：{new Date().toLocaleString()}</div>
        </div>
        <div className="neo-header-right">
          <div className="neo-availability glass">
            <span className="kpi-title">系统可用性</span>
            <span className="kpi-number">{avail}%</span>
          </div>
        </div>
      </header>

      {/* 主网格（两行 KPI + 两行图表） */}
      <main className="neo-grid">
        {/* KPI：两行×6（共 12 张，整齐无空洞） */}
        <div className="kpi glass"><span className="kpi-title">教师数量</span><span className="kpi-number">{data.counts.teacher}</span></div>
        <div className="kpi glass"><span className="kpi-title">学生数量</span><span className="kpi-number">{data.counts.student}</span></div>
        <div className="kpi glass"><span className="kpi-title">课件数量</span><span className="kpi-number">{data.counts.courseware}</span></div>
        <div className="kpi glass"><span className="kpi-title">练习数量</span><span className="kpi-number">{data.counts.exercise}</span></div>
        <div className="kpi glass"><span className="kpi-title">公共资料数</span><span className="kpi-number">{data.counts.public_doc}</span></div>
        <div className="kpi glass"><span className="kpi-title">平均完成时长 (h)</span><span className="kpi-number">{data.learning.avg_completion_hours.toFixed(1)}</span></div>

        <div className="kpi glass"><span className="kpi-title">平均响应时长 (ms)</span><span className="kpi-number">{data.system.avg_response_ms.toFixed(1)}</span></div>
        <div className="kpi glass"><span className="kpi-title">平均接口错误率</span><span className="kpi-number">{(performance.averageErrorRate * 100).toFixed(2)}%</span></div>
        <div className="kpi glass"><span className="kpi-title">平均页面加载时长 (ms)</span><span className="kpi-number">{performance.averageLoadTime.toFixed(1)}</span></div>
        <div className="kpi glass"><span className="kpi-title">在线教师数</span><span className="kpi-number">{online.teachers}</span></div>
        <div className="kpi glass"><span className="kpi-title">在线学生数</span><span className="kpi-number">{online.students}</span></div>
        <div className="kpi glass"><span className="kpi-title">作业完成率</span><span className="kpi-number">{(participation.assignmentCompletionRate * 100).toFixed(1)}%</span></div>

        {/* 图表区 */}
        <div className="panel glass panel-activity">
          <div className="panel-h">
            <span>活跃度趋势（30天）</span>
            <span className="badge">随练使用率 {practiceRate}</span>
          </div>
          <div className="panel-c">
            <Line
              data={{
                labels: activityLabels,
                datasets: [
                  { label: '教师', data: teacherSeries, borderColor: '#33C5FF', backgroundColor: 'rgba(51,197,255,0.15)', tension: 0.35, fill: true },
                  { label: '学生', data: studentSeries, borderColor: '#FF5D9E', backgroundColor: 'rgba(255,93,158,0.15)', tension: 0.35, fill: true },
                ],
              }}
              options={darkChartOpts}
            />
          </div>
        </div>

        <div className="panel glass panel-score">
          <div className="panel-h"><span>成绩分布</span></div>
          <div className="panel-c"><Bar data={scoreData} options={darkChartOpts} /></div>
        </div>

        <div className="panel glass panel-mastery">
          <div className="panel-h"><span>知识点掌握度</span></div>
          <div className="panel-c"><Radar data={masteryData} options={darkChartOpts} /></div>
        </div>

        <div className="panel glass panel-cwday">
          <div className="panel-h"><span>课件生成（按天）</span></div>
          <div className="panel-c"><Line data={cwDayData} options={darkChartOpts} /></div>
        </div>

        <div className="panel glass panel-trend">
          <div className="panel-h"><span>新建课程／练习趋势</span></div>
          <div className="panel-c"><Line data={newCourseData} options={darkChartOpts} /></div>
        </div>

        <div className="panel glass panel-pies">
          <div className="subpanel">
            <div className="panel-h tight"><span>班级数量</span><strong>{stats.classCount}</strong></div>
            <div className="panel-c mini"><Pie data={classDistData} options={classDistOptions} /></div>
          </div>
          <div className="subpanel">
            <div className="panel-h tight"><span>题型占比</span></div>
            <div className="panel-c mini"><Pie data={qData} /></div>
          </div>
        </div>
      </main>
    </div>
  );
}
