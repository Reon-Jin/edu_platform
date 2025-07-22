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
  Legend
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

  if (error) {
    return <div className="card error-card">{error}</div>;
  }
  if (!data || !online || !participation || !performance || !stats || !courseTrend) {
    return <div className="card loading-card">加载中...</div>;
  }

  // 数据准备
  const activityLabels = data.activity.trend.map(t => t.date);
  const teacherSeries = data.activity.trend.map(t => t.teacher);
  const studentSeries = data.activity.trend.map(t => t.student);

  const scoreData = {
    labels: ['A','B','C','D','F'],
    datasets: [{
      label: '人数',
      data: ['A','B','C','D','F'].map(k => data.homework.score_dist[k] || 0),
      backgroundColor: '#4BC0C0',
      borderColor: '#36A2EB',
      borderWidth: 1,
    }],
  };

  const masteryLabels = Object.keys(data.homework.mastery);
  const masteryData = {
    labels: masteryLabels,
    datasets: [{
      label: '掌握度 (%)',
      data: masteryLabels.map(k => (data.homework.mastery[k] * 100).toFixed(1)),
      backgroundColor: 'rgba(54,162,235,0.3)',
      borderColor: 'rgba(54,162,235,1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(54,162,235,1)',
    }],
  };

  const dayKeys = Object.keys(data.courseware_prod.day).sort();
  const cwDayData = {
    labels: dayKeys,
    datasets: [{
      label: '课件数',
      data: dayKeys.map(k => data.courseware_prod.day[k]),
      borderColor: 'rgba(255,99,132,1)',
      backgroundColor: 'rgba(255,99,132,0.3)',
      tension: 0.3,
    }],
  };

  const newCourseData = {
    labels: courseTrend.labels,
    datasets: [
      {
        label: '课程',
        data: courseTrend.course,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54,162,235,0.3)',
        tension: 0.3,
      },
      {
        label: '练习',
        data: courseTrend.exercise,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255,99,132,0.3)',
        tension: 0.3,
      },
    ],
  };

  const qLabels = Object.keys(data.courseware_prod.qtype);
  const qData = {
    labels: qLabels.map(k => qTypeMap[k] || k),
    datasets: [{
      data: qLabels.map(k => data.courseware_prod.qtype[k]),
      backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF'],
      hoverOffset: 4,
    }],
  };

  const subjectLabels = Object.keys(stats.classDistribution);
  const classDistData = {
    labels: subjectLabels,
    datasets: [{
      data: subjectLabels.map(s => stats.classDistribution[s].count),
      backgroundColor: [
        '#FF6384','#36A2EB','#FFCE56','#4BC0C0',
        '#9966FF','#F67019','#F53794','#B234AB'
      ],
      hoverOffset: 4,
    }],
  };
  const classDistOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: ctx => {
            const label = ctx.label || '';
            const names = stats.classDistribution[label].classes.join(', ');
            return `${label}: ${ctx.parsed}个班级\n${names}`;
          },
        },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        {/* 头部 */}
        <header className="dashboard-header">
    {/* 左侧：标题 + 工具栏 */}
    <div className="header-left">
      <h2 className="dashboard-title">平台管理看板</h2>
      <p className="dashboard-desc">实时监控教师、学生、课件和练习等关键指标。</p>
      <div className="dashboard-toolbar">
        <button className="btn">刷新</button>
        <button className="btn btn-primary">导出数据</button>
        <button className="btn">筛选</button>
      </div>
      <div className="dashboard-update-time">
        数据更新时间：{new Date().toLocaleString()}
      </div>
    </div>

    {/* 右侧：系统可用性 */}
    <div className="header-right">
      <div className="availability-card">
        <h4>系统可用性</h4>
        <p>
          {/* 计算：100% - 平均接口错误率 */}
          {(100 - performance.averageErrorRate * 100).toFixed(2)}%
        </p>
      </div>
    </div>
  </header>


        {/* 概览卡片 */}
        <section className="overview-section">
          {/* 规模类 */}
          <div className="group scale-group">
            <h3 className="group-title">规模类</h3>
            <div className="group-cards">
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
                <h4>公共资料数</h4>
                <p>{data.counts.public_doc}</p>
              </div>
            </div>
          </div>

          {/* 性能 & 体验 */}
          <div className="group performance-group">
            <h3 className="group-title">性能 & 体验</h3>
            <div className="group-cards">
              <div className="card overview-card">
                <h4>平均完成时长 (h)</h4>
                <p>{data.learning.avg_completion_hours.toFixed(1)}</p>
              </div>
              <div className="card overview-card">
                <h4>平均响应时长 (ms)</h4>
                <p>{data.system.avg_response_ms.toFixed(1)}</p>
              </div>
              <div className="card overview-card">
                <h4>平均接口错误率</h4>
                <p>{(performance.averageErrorRate * 100).toFixed(2)}%</p>
              </div>
              <div className="card overview-card">
                <h4>平均页面加载时长 (ms)</h4>
                <p>{performance.averageLoadTime.toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* 实时在线 */}
          <div className="group realtime-group">
            <h3 className="group-title">实时在线</h3>
            <div className="group-cards">
              <div className="card overview-card">
                <h4>在线教师数</h4>
                <p>{online.teachers}</p>
              </div>
              <div className="card overview-card">
                <h4>在线学生数</h4>
                <p>{online.students}</p>
              </div>
            </div>
          </div>

          {/* 参与度 */}
          <div className="group participation-group">
            <h3 className="group-title">参与度</h3>
            <div className="group-cards">
              <div className="card overview-card">
                <h4>作业完成率</h4>
                <p>{(participation.assignmentCompletionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="card overview-card">
                <h4>随练使用率</h4>
                <p>{(participation.practiceUsageRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* 组织结构 */}
          <div className="group structure-group">
            <h3 className="group-title">组织结构</h3>
            <div className="group-cards">
              <div className="card overview-card">
                <h4>班级数量</h4>
                <p>{stats.classCount}</p>
              </div>
              <div className="card overview-card class-chart-card">
                <h4>班级分布</h4>
                <Pie data={classDistData} options={classDistOptions} />
              </div>
            </div>
          </div>
        </section>

        {/* 图表区 */}
        <section className="charts-section">
          <div className="charts-grid">
            <div className="card chart-card">
              <div className="chart-card-header">
                <h4>活跃度趋势（30天）</h4>
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
                options={{ scales: { y: { beginAtZero: true } } }}
              />
            </div>

            <div className="card chart-card">
              <div className="chart-card-header">
                <h4>成绩分布</h4>
              </div>
              <Bar data={scoreData} options={{ scales: { y: { beginAtZero: true } } }} />
            </div>

            <div className="card chart-card">
              <div className="chart-card-header">
                <h4>知识点掌握度</h4>
              </div>
              <Radar data={masteryData} options={{ scales: { r: { beginAtZero: true } } }} />
            </div>

            <div className="card chart-card">
              <div className="chart-card-header">
                <h4>课件生成（按天）</h4>
              </div>
              <Line data={cwDayData} options={{ scales: { y: { beginAtZero: true } } }} />
            </div>

            <div className="card chart-card">
              <div className="chart-card-header">
                <h4>新建课程／练习趋势</h4>
              </div>
              <Line data={newCourseData} options={{ scales: { y: { beginAtZero: true } } }} />
            </div>

            <div className="card chart-card">
              <div className="chart-card-header">
                <h4>题型占比</h4>
              </div>
              <Pie data={qData} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
