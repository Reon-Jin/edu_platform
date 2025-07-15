import React, { useState } from "react";
import Stepper from "../components/Stepper";
import Tooltip from "../components/Tooltip";

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
    num_mcq: 5,
    num_fill_blank: 5,
    num_short_answer: 1,
    num_programming: 0,
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
      [name]: name.startsWith("num_") ? Number(value) : value,
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
      let id = exId;
      if (!id) {
        const res = await saveExercise({
          topic: form.topic,
          questions: preview.questions,
          answers: preview.answers,
        });
        id = res.id;
        setExId(id);
        setSaved(true);
      }
      const data = await fetchTeacherClasses();
      setClassList(data);
      setShowClasses(true);
    } catch (err) {
      console.error(err);
      setError("保存失败");
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
    form.num_mcq +
    form.num_fill_blank +
    form.num_short_answer +
    form.num_programming;

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
          <div className="grid-2">
            <label>
              选择题数量
              <Tooltip text="单选或多选题目" />
              <Stepper
                value={form.num_mcq}
                onChange={(v) => setForm((p) => ({ ...p, num_mcq: v }))}
                min={0}
                max={20}
              />
            </label>
            <label>
              填空题数量
              <Tooltip text="在句子中留空填入答案" />
              <Stepper
                value={form.num_fill_blank}
                onChange={(v) => setForm((p) => ({ ...p, num_fill_blank: v }))}
                min={0}
                max={20}
              />
            </label>
            <label>
              简答题数量
              <Tooltip text="需要简短回答的题目" />
              <Stepper
                value={form.num_short_answer}
                onChange={(v) => setForm((p) => ({ ...p, num_short_answer: v }))}
                min={0}
                max={20}
              />
            </label>
            <label>
              编程题数量
              <Tooltip text="提交代码的题目" />
              <Stepper
                value={form.num_programming}
                onChange={(v) => setForm((p) => ({ ...p, num_programming: v }))}
                min={0}
                max={20}
              />
            </label>
          </div>
          <div className="total-count">共计 {total} 题</div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "生成中…" : "生成练习"}
          </button>
        </div>
      </form>

        {showPreview && preview && (
          <div className="preview-area card" style={{ marginTop: "1rem" }}>
            <div className="actions">
              <button className="button" onClick={handleSave} disabled={saved}>
                {saved ? "已保存" : "保存练习"}
              </button>
              <button className="button" onClick={handleSaveAssign}>
                保存并布置
              </button>
              <button className="button" onClick={handleDownloadQ} disabled={!exId}>
                下载题目 PDF
              </button>
              <button className="button" onClick={handleDownloadA} disabled={!exId}>
                下载答案 PDF
              </button>
            </div>
            {showClasses && (
              <div style={{ maxHeight: "200px", overflowY: "auto", margin: "1rem 0" }}>
                {classList.map((c) => (
                  <div key={c.id} style={{ marginBottom: "0.5rem" }}>
                    <button
                      className="button"
                      onClick={() => handleSelectClass(c.id)}
                      disabled={assignedClasses.includes(c.id)}
                    >
                      {assignedClasses.includes(c.id) ? `${c.name}（已布置）` : c.name}
                    </button>
                  </div>
                ))}
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
