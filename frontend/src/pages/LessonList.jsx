// src/pages/LessonList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchLessonList } from "../api/teacher";
import { formatDateTime } from "../utils";
import "../index.css";

export default function LessonList() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");  // 用于显示错误信息

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

  return (
    <div className="container">
      <div className="card">
        <h2>我的教案列表</h2>
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
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.topic}</td>
                  <td>{formatDateTime(lesson.created_at)}</td>
                  <td>
                    <Link to={`/teacher/lesson/preview/${lesson.id}`}>
                      预览
                    </Link>
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
