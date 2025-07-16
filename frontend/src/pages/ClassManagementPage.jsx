import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeacherClasses, createClass } from '../api/teacher';
import '../index.css';

const subjects = ['语文','数学','英语','物理','化学','地理','生物','历史','政治'];

export default function ClassManagementPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTeacherClasses();
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

  const handleCreate = async () => {
    try {
      await createClass({ name, subject });
      setShowForm(false);
      setName('');
      setSubject(subjects[0]);
      await load();
    } catch (err) {
      alert('创建失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>班级管理</h2>
          <button className="button" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>
            创建班级
          </button>
        </div>
        {showForm && (
          <div style={{ margin: '1rem 0' }}>
            <input className="input" placeholder="班级名称" value={name} onChange={(e)=>setName(e.target.value)} />
            <select className="input" value={subject} onChange={(e)=>setSubject(e.target.value)}>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="button" style={{ width: 'auto' }} onClick={handleCreate}>提交</button>
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
                    <button className="button" onClick={() => navigate(`/teacher/classes/${c.id}`)} style={{width:'auto'}}>
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
