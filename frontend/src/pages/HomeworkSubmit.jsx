import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitHomework, fetchHomework } from "../api/student";
import "../index.css";

export default function HomeworkSubmit() {
  const { hw_id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [answers, setAnswers] = useState({});
  const [curIdx, setCurIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const data = await fetchHomework(hw_id);
        setExercise(data);
      } catch (err) {
        console.error(err);
        setError("加载作业失败");
      }
    };
    load();
  }, [hw_id]);

  const qList = exercise
    ? exercise.prompt.flatMap((blk) =>
        blk.items.map((it) => ({ ...it, qtype: blk.type }))
      )
    : [];

  const cur = qList[curIdx];

  const handleInput = (val) => {
    setAnswers((prev) => ({ ...prev, [cur.id]: val }));
  };

  const handlePrev = () => {
    setCurIdx((i) => Math.max(0, i - 1));
  };

  const handleNext = async () => {
    if (curIdx >= qList.length - 1) {
      setLoading(true);
      setError("");
      try {
        await submitHomework(hw_id, answers);
        navigate("/student");
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "提交失败");
      } finally {
        setLoading(false);
      }
    } else {
      setCurIdx((i) => i + 1);
    }
  };

  const goto = (idx) => setCurIdx(idx);

  return (
    <div className="container">
      <div className="card">
        <h2>作业答题</h2>
        {error && <div className="error">{error}</div>}
        {!exercise ? (
          <div>加载中...</div>
        ) : (
          <div style={{ display: "flex" }}>
            <div style={{ width: 120 }}>
              {qList.map((q, idx) => (
                <div
                  key={q.id}
                  onClick={() => goto(idx)}
                  style={{
                    padding: "4px 8px",
                    cursor: "pointer",
                    background: idx === curIdx ? "#e0e0e0" : "transparent",
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, marginLeft: "1rem" }}>
              <div>{cur.question}</div>
              {cur.options ? (
                <ul>
                  {cur.options.map((opt, i) => (
                    <li key={i} style={{ listStyle: "none" }}>
                      <label>
                        <input
                          type="radio"
                          name="opt"
                          checked={answers[cur.id] === opt}
                          onChange={() => handleInput(opt)}
                        />
                        {opt}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <textarea
                  className="input"
                  rows="6"
                  value={answers[cur.id] || ""}
                  onChange={(e) => handleInput(e.target.value)}
                />
              )}
              <div className="actions">
                <button
                  className="button"
                  onClick={handlePrev}
                  disabled={curIdx === 0}
                >
                  上一题
                </button>
                <button className="button" onClick={handleNext} disabled={loading}>
                  {curIdx === qList.length - 1 ? "提交" : "下一题"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

