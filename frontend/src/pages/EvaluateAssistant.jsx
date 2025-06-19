import React, { useState, useEffect } from "react";
import api from "../api/api";
import { generateSelfPractice } from "../api/student";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../index.css";

export default function EvaluateAssistant() {
  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [req, setReq] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setAnalysis("");
      setAnalysisLoading(true);
      try {
        const resp = await api.get("/student/analysis");
        setAnalysis(resp.data.analysis || JSON.stringify(resp.data));
      } catch (err) {
        console.error(err);
        setError("加载分析失败");
      } finally {
        setAnalysisLoading(false);
      }
    };
    load();
  }, []);

  const gen = async () => {
    const data = await generateSelfPractice(req);
    alert("已生成并保存随练ID:" + data.id);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>评测助手</h2>
        {error && <div className="error">{error}</div>}
        <div className="markdown-preview" style={{ minHeight: '6rem', marginBottom: '1rem' }}>
          {analysisLoading ? '正在努力为您分析学习情况…' : (
            <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
          )}
        </div>
        <input
          className="input"
          value={req}
          onChange={(e) => setReq(e.target.value)}
          placeholder="练习要求"
        />
        <div className="actions">
          <button className="button" onClick={gen}>生成随练</button>
          <button className="button" onClick={() => navigate("/student/self_practice")}>我的随练</button>
        </div>
      </div>
    </div>
  );
}
