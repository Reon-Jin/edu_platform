import React, { useEffect, useState, useMemo } from "react";
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
        // 后端现在返回 { topic, prompt, answers } 或 { topic, questions, answers }
        // 这里统一把 questions 重命名为 prompt
        const prompt = data.prompt ?? data.questions ?? [];
        setExercise({ ...data, prompt });
      } catch (err) {
        console.error(err);
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ex_id]);

  // 按 type 分组，只在 exercise.prompt 改变时重新计算
  const grouped = useMemo(() => {
    if (!exercise) return {};
    return (exercise.prompt).reduce((acc, block) => {
      const { type, items } = block;
      if (!acc[type]) acc[type] = [];
      acc[type].push(...items);
      return acc;
    }, {});
  }, [exercise]);

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

  const typeLabels = {
    single_choice: "选择题",
    fill_blank: "填空题",
    short_answer: "简答题",
    programming: "编程题",
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
                <button
                  className="button"
                  onClick={handleAssign}
                  disabled={assigned}
                >
                  {assigned ? "已布置" : "布置作业"}
                </button>
                <button className="button" onClick={handleDownloadQ}>
                  下载题目 PDF
                </button>
                <button className="button" onClick={handleDownloadA}>
                  下载答案 PDF
                </button>
                <button className="button" onClick={goStats}>
                  查看统计
                </button>
              </div>

              <div style={{ marginTop: "1rem" }}>
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type} style={{ marginBottom: "2rem" }}>
                    {/* 题型标题 */}
                    <h3>{typeLabels[type] || type}</h3>
                    {/* 题目列表 */}
                    {items.map((item, idx) => (
                      <div
                        key={item.id ?? idx}
                        style={{ margin: "0.5rem 0 1rem 1rem" }}
                      >
                        <strong>{idx + 1}. </strong>
                        {item.question}
                        {item.options && item.options.length > 0 && (
                          <ul style={{ marginTop: "0.5rem" }}>
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
