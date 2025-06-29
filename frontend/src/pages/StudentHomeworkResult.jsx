import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../index.css";

export default function StudentHomeworkResult() {
  const { hw_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get(`/student/homeworks/${hw_id}/result`);
        setData(resp.data);
      } catch (err) {
        console.error(err);
        const detail = err.response?.data?.detail;
        setError(detail ? `加载失败：${detail}` : "加载失败");
      }
    };
    load();
  }, [hw_id]);

  if (error) return <div>{error}</div>;
  if (!data) return <div>加载中...</div>;

  const { exercise, student_answers, feedback, score } = data;
  const results = feedback.results || {};

  const fmt = (r) =>
    r === "correct" || r === "正确" || r === true ? "对" : "错";

  const questions = [];
  exercise.prompt.forEach((block) => {
    block.items.forEach((item) => questions.push(item));
  });

  const activeItem = questions.find((q) => String(q.id) === String(activeId));

  return (
    <div className="container">
      <div className="card">
        <button
          className="button"
          style={{ width: "auto", marginBottom: "1rem" }}
          onClick={() => navigate(-1)}
        >
          返回
        </button>
        <h2>作业结果</h2>
        <div>总分：{score}</div>
        <div className="actions">
          {questions.map((q) => (
            <button
              key={q.id}
              className="button"
              onClick={() => setActiveId(q.id)}
            >
              {q.id}
            </button>
          ))}
        </div>
        {activeItem && (
          <div style={{ marginTop: "1rem" }}>
            <h3>题号 {activeItem.id}</h3>
            <div>{activeItem.question}</div>
            {activeItem.options && (
              <ul>
                {activeItem.options.map((opt, idx) => (
                  <li key={idx}>{opt}</li>
                ))}
              </ul>
            )}
            <div>我的答案：{String(student_answers[activeItem.id])}</div>
            <div>标准答案：{String(exercise.answers[activeItem.id])}</div>
            <div>结果：{fmt(results[activeItem.id])}</div>
            <div>解析：{feedback.explanations[activeItem.id]}</div>
          </div>
        )}
      </div>
    </div>
  );
}
