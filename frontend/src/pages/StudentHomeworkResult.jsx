import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

export default function StudentHomeworkResult() {
  const { hw_id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get(`/student/homeworks/${hw_id}/result`);
        setData(resp.data);
      } catch (err) {
        console.error(err);
        setError("加载失败");
      }
    };
    load();
  }, [hw_id]);

  if (error) return <div>{error}</div>;
  if (!data) return <div>加载中...</div>;

  const { exercise, student_answers, feedback } = data;

  return (
    <div>
      <h2>作业结果</h2>
      {exercise.prompt.map((block, bIdx) => (
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
              <div>我的答案：{String(student_answers[item.id])}</div>
              <div>标准答案：{String(exercise.answers[item.id])}</div>
              <div>解析：{feedback.explanations[item.id]}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
