import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchHomeworkResult } from "../api/student";
import "../index.css";

export default function HomeworkResult() {
  const { hw_id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchHomeworkResult(hw_id);
        setResult(data);
      } catch (err) {
        console.error(err);
        setError("加载结果失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hw_id]);

  return (
    <div className="container">
      <div className="card">
        <h2>作业结果</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          result && (
            <div>
              <p>得分：{result.score}</p>
              <h3>题目</h3>
              <pre>{JSON.stringify(result.exercise, null, 2)}</pre>
              <h3>我的答案</h3>
              <pre>{JSON.stringify(result.student_answers, null, 2)}</pre>
              <h3>反馈</h3>
              <pre>{JSON.stringify(result.feedback, null, 2)}</pre>
            </div>
          )
        )}
      </div>
    </div>
  );
}
