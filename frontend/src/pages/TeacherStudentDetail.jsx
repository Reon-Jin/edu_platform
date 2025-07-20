import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchStudentAnalysis, fetchStudentHomeworks } from '../api/teacher';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../index.css';

export default function TeacherStudentDetail() {
  const { sid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cid = searchParams.get('cid');
  const [analysis, setAnalysis] = useState('');
  const [homeworks, setHomeworks] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingHw, setLoadingHw] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = homeworks.filter((h) =>
    h.subject.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setAnalysis('');
    setAnalysisLoading(true);
    fetchStudentAnalysis(sid, cid)
      .then((a) => setAnalysis(a.analysis))
      .catch((err) => {
        console.error(err);
        setAnalysis('分析失败');
      })
      .finally(() => setAnalysisLoading(false));

    setLoadingHw(true);
    fetchStudentHomeworks(sid, cid)
      .then((list) => setHomeworks(list))
      .catch((err) => {
        console.error(err);
        setError('加载失败');
      })
      .finally(() => setLoadingHw(false));
  }, [sid, cid]);

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
        <h2>学生 {sid} 学情</h2>
        {error && <div className="error">{error}</div>}
        <div className="markdown-preview" style={{ minHeight: '6rem' }}>
          {analysisLoading ? '加载中...' : (
            <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
          )}
        </div>
        <h3 style={{ marginTop: '1rem' }}>已完成作业</h3>
        <input
          className="input"
          placeholder="搜索作业"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
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
              {filtered.map((p) => (
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
