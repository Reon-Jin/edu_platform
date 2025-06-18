import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchStudentPracticeDetail } from '../api/teacher';
import '../index.css';

export default function TeacherStudentPracticeDetail() {
  const { sid, pid } = useParams();
  const [practice, setPractice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStudentPracticeDetail(sid, pid);
        setPractice(data);
      } catch (err) {
        console.error(err);
        setError('加载失败');
      }
    };
    load();
  }, [sid, pid]);

  if (error) return <div className="container">{error}</div>;
  if (!practice) return <div className="container">加载中...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>练习 {practice.topic}</h2>
        {practice.questions.map((block, idx) => (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            <strong>{block.type}</strong>
            {block.items.map((item) => (
              <div key={item.id} style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                <div>{item.question}</div>
                {item.options && (
                  <ul>
                    {item.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
                <div>学生答案：{String(practice.student_answers[item.id])}</div>
                <div>标准答案：{String(practice.answers[item.id])}</div>
                <div>解析：{practice.feedback?.explanations?.[item.id]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
