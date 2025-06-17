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
        console.error(err);
        setError("加载统计失败");
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
        {loading ? (
          <div>加载中...</div>
        ) : (
          stats && (
            <ul>
              <li>提交总数：{stats.total_submissions}</li>
              <li>平均分：{stats.average_score}</li>
            </ul>
          )
        )}
      </div>
    </div>
  );
}
