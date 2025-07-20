import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../index.css";

export default function StudentHomeworks() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  const filtered = list.filter((hw) =>
    hw.subject.toLowerCase().includes(search.toLowerCase())
  );

  const statusMap = {
    not_submitted: "未提交",
    grading: "批改中",
    completed: "已完成",
  };

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get("/student/homeworks");
        setList(resp.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>我的作业</h2>
        <input
          className="input"
          placeholder="搜索作业"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((hw) => (
              <tr key={hw.homework_id}>
                <td>{hw.subject}</td>
                <td>
                  <span
                    className={`badge ${
                      hw.status === "not_submitted"
                        ? "badge-not_submitted"
                        : hw.status === "completed"
                        ? "badge-completed"
                        : hw.status === "overdue"
                        ? "badge-overdue"
                        :hw.status === "grading"
                        ? "badge-grading"
                        : ""
                    }`}
                  >
                    {statusMap[hw.status] || hw.status}
                  </span>
                </td>
                <td>
                  {hw.status === "not_submitted" && (
                    <button
                      className="button"
                      onClick={() => navigate(`answer/${hw.homework_id}`)}
                    >
                      答题
                    </button>
                  )}
                  {hw.status === "completed" && (
                    <button
                      className="button"
                      onClick={() => navigate(`result/${hw.homework_id}`)}
                    >
                      查看结果
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
