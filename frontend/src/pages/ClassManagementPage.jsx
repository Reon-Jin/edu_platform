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
  const [subjectFilter, setSubjectFilter] = useState('');
  const [minCount, setMinCount] = useState('');
  const [maxCount, setMaxCount] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTeacherClasses();
      setList(data);
    } catch (err) {
      console.error(err);
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
      alert('创建成功');
    } catch (err) {
      console.error(err);
      alert('创建失败');
    }
  };

  const filtered = list.filter(c =>
    (!subjectFilter || c.subject === subjectFilter) &&
    (!minCount || c.student_count >= Number(minCount)) &&
    (!maxCount || c.student_count <= Number(maxCount))
  );
  const pageSize = 6;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>班级管理</h2>
          <button className="button btn-secondary" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>
            创建班级
          </button>
        </div>

        {showForm && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input placeholder="班级名称" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 'auto' }} />
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: 'auto' }}>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="button btn-secondary" style={{ width: 'auto' }} onClick={handleCreate}>提交</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select
            style={{ width: 'auto' }}
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
          >
            <option value="">学科</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            placeholder="人数下限"
            type="number"
            value={minCount}
            onChange={(e) => { setMinCount(e.target.value); setPage(1); }}
            style={{ width: 'auto' }}
          />
          <input
            placeholder="人数上限"
            type="number"
            value={maxCount}
            onChange={(e) => { setMaxCount(e.target.value); setPage(1); }}
            style={{ width: 'auto' }}
          />
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="grid-2">
            {paged.map((c) => (
              <div key={c.id} className="class-box">
                <strong>{c.name}</strong>
                <span className="chip" style={{ marginLeft: '0.5rem' }}>{c.subject}</span>
                <div style={{ fontSize: '0.875rem', width: '100%' }}>学生人数：{c.student_count}</div>
                <button
                  className="button btn-secondary"
                  style={{ width: 'auto' }}
                  onClick={() => navigate(`/teacher/classes/${c.id}`)}
                >
                  查看
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            className="button btn-tertiary"
            style={{ width: 'auto' }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          <span style={{ alignSelf: 'center', fontSize: '0.875rem' }}>{page}/{totalPages}</span>
          <button
            className="button btn-tertiary"
            style={{ width: 'auto' }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
