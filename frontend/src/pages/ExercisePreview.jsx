// ExercisePreview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchExercisePreview,
  downloadQuestionsPdf,
  downloadAnswersPdf,
  assignExerciseToClass,
  fetchTeacherClasses,
} from "../api/teacher";
import "../index.css";

export default function ExercisePreview() {
  const { ex_id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [classList, setClassList] = useState([]);
  const [showClasses, setShowClasses] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchExercisePreview(ex_id);
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

  const grouped = useMemo(() => {
    if (!exercise) return {};
    return exercise.prompt.reduce((acc, block) => {
      const { type, items } = block;
      if (!acc[type]) acc[type] = [];
      acc[type].push(...items);
      return acc;
    }, {});
  }, [exercise]);

  // 点击布置作业：首次展开时拉班级，否则只切换显示
  const handleAssign = async () => {
    if (!showClasses && classList.length === 0) {
      try {
        const data = await fetchTeacherClasses();
        setClassList(data);
      } catch (err) {
        console.error(err);
        setError("加载班级失败");
      }
    }
    setShowClasses(prev => !prev);
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
    } catch {
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
    } catch {
      setError("下载答案失败");
    }
  };

  const goStats = () => {
    navigate(`/teacher/exercise/stats/${ex_id}`);
  };

  const handleSelectClass = async cid => {
    try {
      await assignExerciseToClass(ex_id, cid);
      alert("布置成功");
      setAssignedClasses(prev => [...prev, cid]);
    } catch {
      alert("布置失败");
    }
  };

  const typeLabels = {
    single_choice: "单选题",
    multiple_choice: "多选题",
    fill_blank: "填空题",
    short_answer: "简答题",
    coding: "编程题",
  };

  return (
    <div className="container">
      <div className="card">
        <button
          className="button btn-tertiary"
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
                <button className="button btn-primary" onClick={handleAssign}>
                  <i className="icon icon-assign" /> 布置作业
                </button>
                <button className="button btn-secondary" onClick={handleDownloadQ}>
                  <i className="icon icon-download" /> 下载题目 PDF
                </button>
                <button className="button btn-secondary" onClick={handleDownloadA}>
                  <i className="icon icon-download" /> 下载答案 PDF
                </button>
                <button className="button btn-tertiary" onClick={goStats}>
                  <i className="icon icon-stats" /> 查看统计
                </button>
              </div>

              {/* 班级选择区域 */}
              {showClasses && (
                <div className="class-box">
                  {classList.map(c => {
                    const isSel = assignedClasses.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        className={`chip${isSel ? " selected" : ""}`}
                        onClick={() => handleSelectClass(c.id)}
                        disabled={isSel}
                      >
                        {c.name}
                        {isSel && "（已布置）"}
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: "1rem" }}>
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type} style={{ marginBottom: "2rem" }}>
                    <h3>{typeLabels[type] || type}</h3>
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
