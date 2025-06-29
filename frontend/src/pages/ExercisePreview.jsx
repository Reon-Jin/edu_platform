import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchExercisePreview,
  downloadQuestionsPdf,
  downloadAnswersPdf,
  assignExercise,
} from "../api/teacher";
import "../index.css";

export default function ExercisePreview() {
  const { ex_id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assigned, setAssigned] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchExercisePreview(ex_id);
        setExercise(data);
      } catch (err) {
        console.error(err);
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ex_id]);

  const handleAssign = async () => {
    try {
      await assignExercise(ex_id);
      setAssigned(true);
    } catch (err) {
      console.error(err);
      setError("布置失败");
    }
  };

  const handleDownloadQ = async () => {
    try {
      const blob = await downloadQuestionsPdf(ex_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exercise_${ex_id}_questions.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("下载题目失败");
    }
  };

  const handleDownloadA = async () => {
    try {
      const blob = await downloadAnswersPdf(ex_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exercise_${ex_id}_answers.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("下载答案失败");
    }
  };

  const goStats = () => {
    navigate(`/teacher/exercise/stats/${ex_id}`);
  };

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
        <h2>练习预览</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          exercise && (
            <>
              <div className="actions">
                <button className="button" onClick={handleAssign} disabled={assigned}>
                  {assigned ? "已布置" : "布置作业"}
                </button>
                <button className="button" onClick={handleDownloadQ}>下载题目 PDF</button>
                <button className="button" onClick={handleDownloadA}>下载答案 PDF</button>
                <button className="button" onClick={goStats}>查看统计</button>
              </div>
              <div style={{ marginTop: "1rem" }}>
                {exercise.prompt.map((block, bIdx) => (
                  <div key={bIdx} style={{ marginBottom: "1rem" }}>
                    <strong>{block.type}</strong>
                    {block.items.map((item, i) => (
                      <div key={i} style={{ marginLeft: "1rem" }}>
                        {item.question}
                        {item.options && (
                          <ul>
                            {item.options.map((opt, j) => (
                              <li key={j}>{opt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
