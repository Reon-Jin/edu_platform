// src/pages/ExerciseStats.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchExerciseStats } from "../api/teacher";
import "../index.css";

export default function ExerciseStats() {
  const { ex_id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchExerciseStats(ex_id);
        setStats(data);
      } catch (err) {
        setError("加载统计失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ex_id]);

  return (
    <div className="container">
      <div className="card">
        <h2>练习统计</h2>
        {error && <div className="error">{error}</div>}
        {loading || !stats ? (
          <div>加载中...</div>
        ) : (
          <ul>
            <li>提交数量：{stats.total_submissions}</li>
            <li>平均得分：{stats.average_score}</li>
          </ul>
        )}
      </div>
    </div>
  );
}
