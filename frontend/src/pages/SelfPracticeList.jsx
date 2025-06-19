import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSelfPracticeList, downloadSelfPracticePdf } from "../api/student";
import "../index.css";

export default function SelfPracticeList() {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const data = await fetchSelfPracticeList();
      setList(data);
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>我的随练</h2>
        <table>
          <thead>
            <tr>
              <th>主题</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>{p.topic}</td>
                <td>
                  <button
                    className="button"
                    onClick={() => navigate(`/student/self_practice/${p.id}`)}
                  >
                    查看
                  </button>
                  <button
                    className="button"
                    style={{ marginLeft: "0.5rem" }}
                    onClick={async () => {
                      const blob = await downloadSelfPracticePdf(p.id);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `self_practice_${p.id}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    下载 PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
