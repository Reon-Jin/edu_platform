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
    } catch (err) {
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
    } catch (err) {
      alert('加入失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>我的班级</h2>
          <button className="button" style={{ width: 'auto' }} onClick={() => setShowJoin(!showJoin)}>
            加入班级
          </button>
        </div>
        {showJoin && (
          <div style={{ margin: '1rem 0' }}>
            <input className="input" placeholder="班级ID" value={joinId} onChange={(e)=>setJoinId(e.target.value)} />
            <button className="button" style={{ width: 'auto' }} onClick={handleJoin}>提交</button>
          </div>
        )}
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>班级名称</th>
                <th>学科</th>
                <th>ID</th>
                <th>学生人数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.subject}</td>
                  <td>{c.id}</td>
                  <td>{c.student_count}</td>
                  <td>
                    <button className="button" style={{width:'auto'}} onClick={() => navigate(`/student/classes/${c.id}`)}>
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
