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

  const { exercise, student_answers, feedback, score, total_score } = data;
  const results = feedback.results || {};
  const scoreMap = feedback.scores || {};

  const optionLabel = (v) => {
    if (v === undefined || v === null) return v;
    if (Array.isArray(v)) return v.map(optionLabel).join(", ");
    const n = Number(v);
    if (!Number.isNaN(n)) {
      return String.fromCharCode(65 + n);
    }
    const s = String(v).trim();
    if (/^[0-9]+$/.test(s)) {
      const m = parseInt(s, 10);
      return String.fromCharCode(65 + m);
    }
    return s;
  };

  const fmt = (r) =>
    r === "correct" || r === "正确" || r === true ? "对" : "错";

  const typeNames = {
    single_choice: "单选题",
    multiple_choice: "多选题",
    fill_in_blank: "填空题",
    short_answer: "简答题",
    coding:"编程题",
  };

  // 把所有题目扁平到 questions 数组，方便后面点击查看
  const questions = [];
  exercise.prompt.forEach((block) => {
    block.items.forEach((item) => questions.push({ ...item, type: block.type }));
  });
  const activeItem = questions.find((q) => String(q.id) === String(activeId));

  return (
    <div className="container">
      <div className="card">
        <div className="result-header">
          <button
            className="button"
            style={{ width: "auto" }}
            onClick={() => navigate(-1)}
          >
            返回
          </button>
          <h2 style={{ margin: 0 }}>作业结果</h2>
          <div>得分：{score}/{total_score}</div>
        </div>

        {exercise.prompt.map((block, bIdx) => {
          // 计算本题型总题数和做对题数
          const total = block.items.length;
          const correct = block.items.reduce((cnt, item) => {
            return cnt + (fmt(results[item.id]) === "对" ? 1 : 0);
          }, 0);

          return (
            <div className="section-card" key={bIdx}>
              <div className={`section-header header-${block.type}`}>
                {typeNames[block.type] || block.type}（{correct}/{total}）
              </div>
              <div className="section-content">
                {block.items.map((item) => (
                  <div key={item.id} style={{ display: "flex" }}>
                    <button
                      className="qbtn"
                      onClick={() => setActiveId(item.id)}
                    >
                      {item.id}
                      <span
                        className={`result-badge ${
                          fmt(results[item.id]) === "对"
                            ? "result-correct"
                            : "result-wrong"
                        }`}
                      >
                        {fmt(results[item.id]) === "对" ? "✔" : "✖"}
                      </span>
                    </button>
                    {block.type === "short_answer" && (
                      <span className="score-badge">
                        {scoreMap[item.id] ??
                          (fmt(results[item.id]) === "对"
                            ? exercise.points?.short_answer || 1
                            : 0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

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
            <div>
              我的答案：
              {student_answers[activeItem.id] !== undefined
                ? optionLabel(student_answers[activeItem.id])
                : "未作答"}
            </div>
            <div>标准答案：{optionLabel(exercise.answers[activeItem.id])}</div>
            <div>结果：{fmt(results[activeItem.id])}</div>
            <div>解析：{feedback.explanations[activeItem.id]}</div>
          </div>
        )}
      </div>
    </div>
  );
}
