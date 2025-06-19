import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSelfPractice, downloadSelfPracticePdf } from "../api/student";
import "../index.css";

export default function SelfPracticeDetail() {
  const { id } = useParams();
  const [practice, setPractice] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await getSelfPractice(id);
      setPractice(data);
    };
    load();
  }, [id]);

  if (!practice) return <div className="container">加载中...</div>;

  return (
    <div className="container">
      <div className="card">
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
                <div>答案：{practice.answers[item.id]}</div>
              </div>
            ))}
          </div>
        ))}
        <button
          className="button"
          onClick={async () => {
            const blob = await downloadSelfPracticePdf(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `self_practice_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          下载 PDF
        </button>
      </div>
    </div>
  );
}
