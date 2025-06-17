import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import "../index.css";

export default function StudentHomeworkResult() {
  const { hw_id } = useParams();
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
        setError("加载失败");
      }
    };
    load();
  }, [hw_id]);

  if (error) return <div>{error}</div>;
  if (!data) return <div>加载中...</div>;

  const { exercise, student_answers, feedback } = data;

  const questions = [];
  exercise.prompt.forEach((block) => {
    block.items.forEach((item) => questions.push(item));
  });

  const activeItem = questions.find((q) => String(q.id) === String(activeId));

  return (
    <div className="container">
      <div className="card">
        <h2>作业结果</h2>
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
            <div>解析：{feedback.explanations[activeItem.id]}</div>
          </div>
        )}
      </div>
    </div>
  );
}
