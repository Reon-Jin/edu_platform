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

  const typeNames = {
    multiple_choice: "选择题",
    fill_in_blank: "填空题",
    short_answer: "简答题",
  };

  const questions = [];
  exercise.prompt.forEach((block) => {
    block.items.forEach((item) => questions.push({ ...item, type: block.type }));
  });

  const activeItem = questions.find((q) => String(q.id) === String(activeId));

  return (
    <div className="container">
      <div className="card">
        <div className="result-header">
          <button className="button" style={{ width: "auto" }} onClick={() => navigate(-1)}>
            返回
          </button>
          <h2 style={{ margin: 0 }}>作业结果</h2>
          <div>总分：{score}</div>
        </div>

        {exercise.prompt.map((block, bIdx) => (
          <div className="section-card" key={bIdx}>
            <div className={`section-header header-${block.type}`}>
              {typeNames[block.type] || block.type}（{block.items.length}/{block.items.length}）
            </div>
            <div className="section-content">
              {block.items.map((item) => (
                <div key={item.id} style={{ display: "flex" }}>
                  <button className="qbtn" onClick={() => setActiveId(item.id)}>
                    {item.id}
                    <span
                      className={`result-badge ${fmt(results[item.id]) === "对" ? "result-correct" : "result-wrong"}`}
                    >
                      {fmt(results[item.id]) === "对" ? "✔" : "✖"}
                    </span>
                  </button>
                  {block.type === "short_answer" && (
                    <span className="score-badge">
                      {fmt(results[item.id]) === "对" ? 1 : 0}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

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
