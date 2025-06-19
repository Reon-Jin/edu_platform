import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../index.css";

export default function SelfPracticeList() {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const resp = await api.get("/student/self_practice/list");
      setList(resp.data);
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
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>{p.topic}</td>
                <td>{p.status}</td>
                <td>
                  <button
                    className="button"
                    onClick={() => navigate(`/student/self_practice/${p.id}`)}
                  >
                    查看
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
