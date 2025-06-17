import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function EvaluateAssistant() {
  const [analysis, setAnalysis] = useState("");
  const [req, setReq] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get("/student/analysis");
        setAnalysis(resp.data.analysis || JSON.stringify(resp.data));
      } catch (err) {
        console.error(err);
        setError("加载分析失败");
      }
    };
    load();
  }, []);

  const gen = async () => {
    const resp = await api.post("/student/practice/generate", { requirement: req });
    alert("已生成并保存随练ID:" + resp.data.id);
  };

  return (
    <div>
      <h2>评测助手</h2>
      {error && <div>{error}</div>}
      <div>{analysis}</div>
      <div>
        <input value={req} onChange={(e) => setReq(e.target.value)} placeholder="练习要求" />
        <button onClick={gen}>生成随练</button>
      </div>
      <button onClick={() => navigate("/student/practice")}>我的随练</button>
    </div>
  );
}
