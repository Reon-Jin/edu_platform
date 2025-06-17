// src/pages/ExercisePreview.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchExercisePreview,
  downloadExerciseQuestionsPdf,
  downloadExerciseAnswersPdf,
  assignExercise,
} from "../api/teacher";
import "../index.css";

export default function ExercisePreview() {
  const { ex_id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchExercisePreview(ex_id);
        setExercise(data);
      } catch (err) {
        setError("加载预览失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ex_id]);

  const handleDownloadQ = async () => {
    if (!exercise) return;
    setDownloading(true);
    try {
      const blob = await downloadExerciseQuestionsPdf(ex_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `questions_${ex_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("下载题目失败");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadA = async () => {
    if (!exercise) return;
    setDownloading(true);
    try {
      const blob = await downloadExerciseAnswersPdf(ex_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `answers_${ex_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("下载答案失败");
    } finally {
      setDownloading(false);
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await assignExercise(ex_id);
      setAssigned(true);
    } catch (err) {
      setError("布置作业失败");
    } finally {
      setAssigning(false);
    }
  };

  const handleStats = () => {
    navigate(`/teacher/exercise/stats/${ex_id}`);
  };

  const renderQuestion = (block, idx) => (
    <div key={idx} style={{ marginBottom: "1rem" }}>
      <strong>{idx + 1}. [{block.type}]</strong>
      {block.items && (
        <div>
          {block.items.map((item) => (
            <div key={item.id} style={{ marginTop: "0.5rem" }}>
              <div>{item.question}</div>
              {item.options && (
                <ul>
                  {item.options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <div className="card">
        <h2>练习预览</h2>
        {error && <div className="error">{error}</div>}
        {loading || !exercise ? (
          <div>加载中...</div>
        ) : (
          <>
            <div style={{ margin: "1rem 0", display: "flex", gap: "0.5rem" }}>
              <button className="button" onClick={handleDownloadQ} disabled={downloading}>
                {downloading ? "下载中..." : "下载题目"}
              </button>
              <button className="button" onClick={handleDownloadA} disabled={downloading}>
                {downloading ? "下载中..." : "下载答案"}
              </button>
              <button className="button" onClick={handleAssign} disabled={assigned || assigning}>
                {assigned ? "已布置" : assigning ? "布置中..." : "布置作业"}
              </button>
              <button className="button" onClick={handleStats}>统计</button>
            </div>
            <div>
              {exercise.prompt.map((b, i) => renderQuestion(b, i))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
