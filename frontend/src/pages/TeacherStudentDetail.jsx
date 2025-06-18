import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudentAnalysis, fetchStudentPractices } from '../api/teacher';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../index.css';

export default function TeacherStudentDetail() {
  const { sid } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState('');
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const a = await fetchStudentAnalysis(sid);
        setAnalysis(a.analysis);
        const ps = await fetchStudentPractices(sid);
        setPractices(ps);
      } catch (err) {
        console.error(err);
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sid]);

  return (
    <div className="container">
      <div className="card">
        <h2>学生 {sid} 学情</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <>
            <div className="markdown-preview">
              <ReactMarkdown children={analysis} remarkPlugins={[remarkGfm]} />
            </div>
            <h3 style={{ marginTop: '1rem' }}>已完成练习</h3>
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
                {practices.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.topic}</td>
                    <td>{p.score}</td>
                    <td>
                      <button
                        className="button"
                        onClick={() => navigate(`/teacher/students/${sid}/practice/${p.id}`)}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
