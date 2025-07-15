import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSelfPractice, downloadSelfPracticePdf, fetchStudentAnalysis } from "../api/student";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../index.css";

export default function SelfPracticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [practice, setPractice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSelfPractice(id);
        setPractice(data);
      } catch (err) {
        console.error(err);
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setAnalysisLoading(true);
      try {
        const data = await fetchStudentAnalysis();
        setAnalysis(data.analysis);
      } catch (err) {
        console.error(err);
      } finally {
        setAnalysisLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = async () => {
    const blob = await downloadSelfPracticePdf(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `self_practice_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
        <h2>随练预览</h2>
        <div className="markdown-preview" style={{ minHeight: '4rem' }}>
          {analysisLoading ? '正在分析...' : (
            <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
          )}
        </div>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          practice && (
            <>
              <div className="actions">
                <button className="button" onClick={handleDownload}>
                  下载答案 PDF
                </button>
              </div>
              <div style={{ marginTop: "1rem" }}>
                {(practice.questions || []).map((block, bIdx) => (
                  <div key={bIdx} style={{ marginBottom: "1rem" }}>
                    <strong>{block.type}</strong>
                    {(block.items || []).map((item, i) => (
                      <div key={i} style={{ marginLeft: "1rem" }}>
                        {item.question}
                        {item.options && (
                          <ul>
                            {item.options.map((opt, j) => (
                              <li key={j}>{opt}</li>
                            ))}
                          </ul>
                        )}
                        <div>
                          答案：
                          {practice.answers[item.id] ??
                            practice.answers[String(item.id)]}
                        </div>
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
