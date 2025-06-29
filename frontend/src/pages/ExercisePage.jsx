import React, { useState } from "react";

import {
  generateExerciseJson,
  saveExercise,
  saveAndAssignExercise,
  downloadQuestionsPdf,
  downloadAnswersPdf,
} from "../api/teacher";
import "../index.css";

export default function ExercisePage() {
  const [form, setForm] = useState({
    topic: "",
    num_mcq: 5,
    num_fill_blank: 5,
    num_short_answer: 1,
    num_programming: 0,
  });
  const [preview, setPreview] = useState(null);
  const [exId, setExId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name.startsWith("num_") ? Number(value) : value,
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setAssigned(false);
    setExId(null);
    setLoading(true);
    try {
      const data = await generateExerciseJson(form);
      setPreview(data);
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
    try {
      const res = await saveAndAssignExercise({
        topic: form.topic,
        questions: preview.questions,
        answers: preview.answers,
      });
      setExId(res.exercise_id || res.id);
      setSaved(true);
      setAssigned(true);
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

  return (
    <div className="container">
      <div className="card">
        <h2>练习题生成</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleGenerate}>
          <label>
            主题
            <input
              className="input"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            选择题数量
            <input
              className="input"
              type="number"
              name="num_mcq"
              value={form.num_mcq}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label>
            填空题数量
            <input
              className="input"
              type="number"
              name="num_fill_blank"
              value={form.num_fill_blank}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label>
            简答题数量
            <input
              className="input"
              type="number"
              name="num_short_answer"
              value={form.num_short_answer}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label>
            编程题数量
            <input
              className="input"
              type="number"
              name="num_programming"
              value={form.num_programming}
              onChange={handleChange}
              min="0"
            />
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "生成中…" : "生成练习"}
          </button>
        </form>

        {preview && (
          <>
            <div className="actions">
              <button className="button" onClick={handleSave} disabled={saved}>
                {saved ? "已保存" : "保存练习"}
              </button>
              <button className="button" onClick={handleSaveAssign} disabled={assigned}>
                {assigned ? "已布置" : "保存并布置"}
              </button>
              <button className="button" onClick={handleDownloadQ} disabled={!exId}>
                下载题目 PDF
              </button>
              <button className="button" onClick={handleDownloadA} disabled={!exId}>
                下载答案 PDF
              </button>
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}
