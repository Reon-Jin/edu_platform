import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

export default function StudentPracticeDetail() {
  const { id } = useParams();
  const [practice, setPractice] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const load = async () => {
      const resp = await api.get(`/student/practice/list`);
      const item = resp.data.find((p) => String(p.id) === id);
      if (item) setPractice(item);
    };
    load();
  }, [id]);

  const submit = async () => {
    await api.post(`/student/practice/${id}/submit`, { answers });
    alert("已提交");
  };

  if (!practice) return <div>加载中...</div>;

  return (
    <div>
      <h2>{practice.topic}</h2>
      {practice.questions.map((block, bIdx) => (
        <div key={bIdx} style={{ marginBottom: "1rem" }}>
          <strong>{block.type}</strong>
          {block.items.map((item) => (
            <div key={item.id} style={{ marginLeft: "1rem" }}>
              <div>{item.question}</div>
              {item.options && (
                <ul>
                  {item.options.map((opt, idx) => (
                    <li key={idx}>{opt}</li>
                  ))}
                </ul>
              )}
              <input
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      ))}
      {practice.status !== "completed" && <button onClick={submit}>提交</button>}
      {practice.status === "completed" && (
        <div>
          <h3>批改结果</h3>
          <pre>{JSON.stringify(practice.feedback, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
