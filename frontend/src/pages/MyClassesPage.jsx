import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyClasses, joinClass } from '../api/student';
import '../index.css';

export default function MyClassesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyClasses();
      setList(data);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleJoin = async () => {
    try {
      await joinClass(Number(joinId));
      setShowJoin(false);
      setJoinId('');
      load();
      alert('加入成功');
    } catch {
      alert('加入失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>我的班级</h2>
          <button className="button btn-secondary" style={{ width: 'auto' }} onClick={() => setShowJoin(!showJoin)}>
            加入班级
          </button>
        </div>

        {showJoin && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              placeholder="班级ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              style={{ width: 'auto' }}
            />
            <button className="button btn-secondary" style={{ width: 'auto' }} onClick={handleJoin}>提交</button>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="grid-2">
            {list.map((c) => (
              <div key={c.id} className="class-box">
                <strong>{c.name}</strong>
                <span className="chip" style={{ marginLeft: '0.5rem' }}>{c.subject}</span>
                <div style={{ fontSize: '0.875rem', width: '100%' }}>学生人数：{c.student_count}</div>
                <button
                  className="button btn-secondary"
                  style={{ width: 'auto' }}
                  onClick={() => navigate(`/student/classes/${c.id}`)}
                >
                  查看
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
