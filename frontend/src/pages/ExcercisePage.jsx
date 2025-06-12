import React, { useState } from "react";
import {
  generateExerciseJson,
  downloadExercisePdf,
  assignExercise,
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
  const [questions, setQuestions] = useState([]);
  const [exerciseId, setExerciseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
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
    setQuestions([]);
    setAssigned(false);
    setLoading(true);
    try {
      const { exercise_id, questions: qs } = await generateExerciseJson(form);
      setExerciseId(exercise_id);
      setQuestions(qs);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || "生成练习失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadExercisePdf(form);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exercise_${form.topic}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setError("下载 PDF 失败");
    }
  };

  const handleAssign = async () => {
    if (!exerciseId) return;
    try {
      await assignExercise(exerciseId);
      setAssigned(true);
    } catch (error) {
      console.error(error);
      setError("布置作业失败");
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
          {/* ...其余表单项与之前相同... */}
          <button className="button" type="submit" disabled={loading}>
            {loading ? "生成中…" : "生成练习"}
          </button>
        </form>

        {questions.length > 0 && (
          <>
            <div style={{ margin: "1rem 0", display: "flex", gap: "0.5rem" }}>
              <button className="button" onClick={handleDownload}>
                下载 PDF
              </button>
              <button
                className="button"
                onClick={handleAssign}
                disabled={assigned}
              >
                {assigned ? "已布置" : "布置作业"}
              </button>
            </div>
            <div>
              {questions.map((q, idx) => (
                <div key={idx} style={{ marginBottom: "1rem" }}>
                  <strong>{idx + 1}. [{q.type}]</strong> {q.prompt}
                  {q.options && (
                    <ul>
                      {q.options.map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
