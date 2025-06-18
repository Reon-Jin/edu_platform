import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudentAnalysis, fetchStudentHomeworks } from '../api/teacher';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../index.css';

export default function TeacherStudentDetail() {
  const { sid } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState('');
  const [homeworks, setHomeworks] = useState([]);
  const [loadingHw, setLoadingHw] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAnalysis('');
    setAnalysisLoading(true);
    fetchStudentAnalysis(sid)
      .then((a) => setAnalysis(a.analysis))
      .catch((err) => {
        console.error(err);
        setAnalysis('分析失败');
      })
      .finally(() => setAnalysisLoading(false));

    setLoadingHw(true);
    fetchStudentHomeworks(sid)
      .then((list) => setHomeworks(list))
      .catch((err) => {
        console.error(err);
        setError('加载失败');
      })
      .finally(() => setLoadingHw(false));
  }, [sid]);

  return (
    <div className="container">
      <div className="card">
        <h2>学生 {sid} 学情</h2>
        {error && <div className="error">{error}</div>}
        <div className="markdown-preview" style={{ minHeight: '6rem' }}>
          {analysisLoading ? '加载中...' : (
            <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
          )}
        </div>
        <h3 style={{ marginTop: '1rem' }}>已完成作业</h3>
        {loadingHw ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>主题</th>
                <th>得分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {homeworks.map((p) => (
                <tr key={p.homework_id}>
                  <td>{p.homework_id}</td>
                  <td>{p.subject}</td>
                  <td>{p.score}</td>
                  <td>
                    <button
                      className="button"
                      onClick={() => navigate(`/teacher/students/${sid}/homework/${p.homework_id}`)}
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
