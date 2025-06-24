import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../index.css";
import NavButtons from "../components/NavButtons";

export default function StudentHomeworkAnswer() {
  const { hw_id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [flat, setFlat] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get(`/student/homeworks/${hw_id}/exercise`);
        setExercise(resp.data);
      } catch (err) {
        console.error(err);
        setError("加载作业失败");
      }
    };
    load();
  }, [hw_id]);

  useEffect(() => {
    if (!exercise) return;
    const qlist = [];
    exercise.prompt.forEach((block) => {
      block.items.forEach((item) => {
        qlist.push({ ...item, type: block.type });
      });
    });
    setFlat(qlist);
  }, [exercise]);

  const submit = async () => {
    try {
      await api.post(`/student/homeworks/${hw_id}/submit`, { answers });
      navigate(`/student/homeworks/result/${hw_id}`);
    } catch (err) {
      console.error(err);
      setError("提交失败");
    }
  };

  if (error) return <div className="container">{error}</div>;
  if (!exercise || flat.length === 0) return <div className="container">加载中...</div>;

  const question = flat[current];

  const renderOptions = () => {
    if (!question.options) return null;
    return (
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {question.options.map((opt, idx) => (
          <li key={idx}>
            <label>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={answers[question.id] === idx}
                onChange={() =>
                  setAnswers((prev) => ({ ...prev, [question.id]: idx }))
                }
              />
              {opt}
            </label>
          </li>
        ))}
      </ul>
    );
  };

  const renderInput = () => {
    if (question.options) return renderOptions();
    return (
      <textarea
        className="input"
        rows={4}
        value={answers[question.id] || ""}
        onChange={(e) =>
          setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
        }
      />
    );
  };

  return (
    <div className="container">
      <div className="card">
        <h2>{exercise.subject}</h2>
        <NavButtons />
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {flat.map((q, idx) => (
            <button
              key={idx}
              className="button"
              style={{
                width: "3rem",
                padding: "0.5rem",
                backgroundColor: idx === current ? "#005bb5" : undefined,
              }}
              onClick={() => setCurrent(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>{question.question}</div>
          {renderInput()}
        </div>
        <div className="actions">
          {current > 0 && (
            <button className="button" onClick={() => setCurrent(current - 1)}>
              上一题
            </button>
          )}
          {current < flat.length - 1 && (
            <button className="button" onClick={() => setCurrent(current + 1)}>
              下一题
            </button>
          )}
          {current === flat.length - 1 && (
            <button className="button" onClick={submit}>
              提交
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
