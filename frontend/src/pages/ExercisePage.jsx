import React, { useState } from "react";
import Stepper from "../components/Stepper";

import {
  generateExerciseJson,
  saveExercise,
  downloadQuestionsPdf,
  downloadAnswersPdf,
  fetchTeacherClasses,
  assignExerciseToClass,
} from "../api/teacher";
import "../index.css";

export default function ExercisePage() {
  const [form, setForm] = useState({
    topic: "",
    num_single_choice: 5,
    num_multiple_choice: 0,
    num_fill_blank: 5,
    num_short_answer: 1,
    num_programming: 0,
    score_single_choice: 1,
    score_multiple_choice: 1,
    score_fill_blank: 1,
    score_short_answer: 2,
    score_programming: 5,
  });
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exId, setExId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [classList, setClassList] = useState([]);
  const [showClasses, setShowClasses] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name.startsWith("num_") || name.startsWith("score_")
        ? Number(value)
        : value,
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setAssignedClasses([]);
    setExId(null);
    setLoading(true);
    try {
      const data = await generateExerciseJson(form);
      setPreview(data);
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "生成练习失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    try {
      const res = await saveExercise({
        topic: form.topic,
        questions: preview.questions,
        answers: preview.answers,
        points: {
          single_choice: form.score_single_choice,
          multiple_choice: form.score_multiple_choice,
          fill_in_blank: form.score_fill_blank,
          short_answer: form.score_short_answer,
          coding: form.score_programming,
        },
      });
      setExId(res.id);
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("保存练习失败");
    }
  };

  const handleSaveAssign = async () => {
    if (!preview) return;
    setError("");
    try {
      // 1. 确保已保存
      let id = exId;
      if (!id) {
        const res = await saveExercise({
          topic: form.topic,
          questions: preview.questions,
          answers: preview.answers,
          points: {
            single_choice: form.score_single_choice,
            multiple_choice: form.score_multiple_choice,
            fill_in_blank: form.score_fill_blank,
            short_answer: form.score_short_answer,
            coding: form.score_programming,
          },
        });
        id = res.id;
        setExId(id);
        setSaved(true);
      }
      // 2. 首次展开时拉取班级
      if (!showClasses && classList.length === 0) {
        const data = await fetchTeacherClasses();
        setClassList(data);
      }
      // 切换显示/隐藏
      setShowClasses((prev) => !prev);
    } catch (err) {
      console.error(err);
      setError("保存并布置失败");
    }
  };

  const handleDownloadQ = async () => {
    if (!exId) return;
    try {
      const blob = await downloadQuestionsPdf(exId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exercise_${exId}_questions.pdf`;
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
    if (!exId) return;
    try {
      const blob = await downloadAnswersPdf(exId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exercise_${exId}_answers.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("下载答案失败");
    }
  };

  const handleSelectClass = async (cid) => {
    try {
      await assignExerciseToClass(exId, cid);
      alert("布置成功");
      setAssignedClasses((prev) => [...prev, cid]);
    } catch (err) {
      console.error(err);
      alert("布置失败");
    } finally {
      setShowClasses(false);
    }
  };

  const total =
    form.num_single_choice +
    form.num_multiple_choice +
    form.num_fill_blank +
    form.num_short_answer +
    form.num_programming;

  const totalScore =
    form.num_single_choice * form.score_single_choice +
    form.num_multiple_choice * form.score_multiple_choice +
    form.num_fill_blank * form.score_fill_blank +
    form.num_short_answer * form.score_short_answer +
    form.num_programming * form.score_programming;

  return (
    <div className="container">
      <form onSubmit={handleGenerate} style={{ width: "100%", maxWidth: "960px" }}>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2>输入主题</h2>
          {error && <div className="error">{error}</div>}
          <input
            className="input"
            name="topic"
            value={form.topic}
            onChange={handleChange}
            required
            placeholder="输入练习主题"
          />
        </div>

        <div className="card">
          <h2>配置题量</h2>
          <div className="question-config-grid">
            {[
              { label: "单选题", numKey: "num_single_choice", scoreKey: "score_single_choice" },
              { label: "多选题", numKey: "num_multiple_choice", scoreKey: "score_multiple_choice" },
              { label: "填空题", numKey: "num_fill_blank", scoreKey: "score_fill_blank" },
              { label: "简答题", numKey: "num_short_answer", scoreKey: "score_short_answer" },
              { label: "编程题", numKey: "num_programming", scoreKey: "score_programming" },
            ].map(({ label, numKey, scoreKey }) => (
              <div className="question-config-card" key={numKey}>
                <h4>{label}</h4>
                <div className="config-row">
                  <span>数量</span>
                  <Stepper
                    value={form[numKey]}
                    onChange={(v) => setForm((p) => ({ ...p, [numKey]: v }))}
                    min={0}
                    max={20}
                  />
                </div>
                <div className="config-row">
                  <span>分值</span>
                  <Stepper
                    value={form[scoreKey]}
                    onChange={(v) => setForm((p) => ({ ...p, [scoreKey]: v }))}
                    min={1}
                    max={100}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="total-count">共计 {total} 题，总分 {totalScore}</div>
          <button className="button btn-secondary" type="submit" disabled={loading}>
            {loading ? "生成中…" : "生成练习"}
          </button>
        </div>
      </form>

      {showPreview && preview && (
        <div className="preview-area card" style={{ marginTop: "1rem" }}>
          <div className="actions">
            <button
              className="button btn-secondary"
              onClick={handleSave}
              disabled={saved}
            >
              <i className="icon icon-save" /> {saved ? "已保存" : "保存练习"}
            </button>
            <button
              className="button btn-primary"
              onClick={handleSaveAssign}
            >
              <i className="icon icon-assign" /> 保存并布置
            </button>
            <button
              className="button btn-secondary"
              onClick={handleDownloadQ}
              disabled={!exId}
            >
              <i className="icon icon-download" /> 下载题目 PDF
            </button>
            <button
              className="button btn-secondary"
              onClick={handleDownloadA}
              disabled={!exId}
            >
              <i className="icon icon-download" /> 下载答案 PDF
            </button>
          </div>

          {showClasses && (
            <div className="class-box">
              {classList.map((c) => {
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
            {preview.questions.map((block, bIdx) => (
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
        </div>
      )}
    </div>
  );
}
