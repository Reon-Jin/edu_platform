// src/pages/LessonList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchLessonList, deleteCourseware } from "../api/teacher";
import { formatDateTime } from "../utils";
import "../index.css";

export default function LessonList() {
  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");  // 用于显示错误信息

  const filtered = lessons.filter((l) =>
    l.topic.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const loadLessons = async () => {
      setLoading(true);
      setError("");  // 清空上次的错误信息
      try {
        const lessons = await fetchLessonList();
        setLessons(lessons);
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setError("加载课件列表失败，请稍后重试");  // 显示加载错误信息
      } finally {
        setLoading(false);
      }
    };
    loadLessons();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除?')) return;
    try {
      await deleteCourseware(id);
      setLessons(lessons.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
      setError('删除失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>我的教案列表</h2>
        <input
          className="input"
          placeholder="搜索教案"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
        {error && <div className="error">{error}</div>}  {/* 错误显示 */}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>教案主题</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.topic}</td>
                  <td>{formatDateTime(lesson.created_at)}</td>
                  <td className="actions-cell">
                    <Link to={`/teacher/lesson/preview/${lesson.id}`}>预览</Link>
                    <button
                      className="icon-button tooltip"
                      onClick={() => handleDelete(lesson.id)}
                      aria-label="删除"
                    >
                      🗑️<span className="tooltip-text">删除</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
