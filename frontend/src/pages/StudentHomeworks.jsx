import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../index.css";

export default function StudentHomeworks() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  // 过滤
  const filtered = list.filter((hw) =>
    hw.subject.toLowerCase().includes(search.toLowerCase())
  );

  // 状态映射（文字 + Emoji）
  const statusMap = {
    not_submitted: { text: "未提交", icon: "✏️" },
    grading:        { text: "批改中", icon: "🕒" },
    completed:      { text: "已完成", icon: "✅" },
  };

  // 拉数据
  useEffect(() => {
    async function load() {
      try {
        const resp = await api.get("/student/homeworks");
        setList(resp.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  // 统计信息
  const stats = list.reduce(
    (acc, hw) => {
      acc.total++;
      acc[hw.status] = (acc[hw.status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  return (
    <div className="container hw-page">
      <div className="hw-card wide-card">
        {/* 头部 */}
        <div className="hw-header">
          <div className="hw-header-left">
            <h2 className="hw-header-title">
              <span className="hw-icon">📝</span>
              我的作业
            </h2>
            <p className="hw-header-subtitle">查看并管理你的所有作业任务</p>
          </div>
          <div className="hw-header-avatar">
            <img src="https://i.pravatar.cc/150?img=0" alt="avatar" />
          </div>
        </div>

        {/* 统计栏 */}
        <div className="hw-stats">
          <div className="hw-stats-item">
            <p className="hw-stats-number">{stats.total}</p>
            <p className="hw-stats-label">总作业</p>
          </div>
          <div className="hw-stats-item">
            <p className="hw-stats-number">{stats.completed || 0}</p>
            <p className="hw-stats-label">已完成</p>
          </div>
          <div className="hw-stats-item">
            <p className="hw-stats-number">{stats.grading || 0}</p>
            <p className="hw-stats-label">批改中</p>
          </div>
          <div className="hw-stats-item">
            <p className="hw-stats-number">{stats.not_submitted || 0}</p>
            <p className="hw-stats-label">未提交</p>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="hw-search-group">
          <span className="hw-search-icon">🔍</span>
          <input
            type="text"
            className="hw-search-input"
            placeholder="搜索作业"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 作业表格 */}
        <table className="hw-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((hw) => {
              const st = statusMap[hw.status] || { text: hw.status };
              return (
                <tr key={hw.homework_id}>
                  <td className="hw-subject-cell">{hw.subject}</td>
                  <td>
                    <span className={`hw-badge hw-badge-${hw.status}`}>
                      {st.icon} {st.text}
                    </span>
                  </td>
                  <td>
                    {hw.status === "not_submitted" && (
                      <button
                        className="hw-btn hw-btn-sm"
                        onClick={() => navigate(`answer/${hw.homework_id}`)}
                      >
                        <span className="hw-btn-icon">✏️</span>
                        答题
                      </button>
                    )}
                    {hw.status === "completed" && (
                      <button
                        className="hw-btn hw-btn-sm hw-btn-primary"
                        onClick={() => navigate(`result/${hw.homework_id}`)}
                      >
                        <span className="hw-btn-icon">👁️</span>
                        查看结果
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="hw-pagination">
                <button className="hw-page-btn">上一页</button>
                <button className="hw-page-btn">下一页</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
