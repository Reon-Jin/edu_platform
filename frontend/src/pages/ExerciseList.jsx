// src/pages/ExerciseList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchExerciseList } from "../api/teacher";
import "../index.css";

export default function ExerciseList() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const list = await fetchExerciseList();
        setExercises(list);
      } catch (err) {
        setError("加载练习列表失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>我的练习列表</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>主题</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr key={ex.id}>
                  <td>{ex.id}</td>
                  <td>{ex.subject}</td>
                  <td>{ex.created_at}</td>
                  <td>
                    <Link to={`/teacher/exercise/preview/${ex.id}`}>预览</Link>
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
